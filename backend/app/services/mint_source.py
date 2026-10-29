import re
import httpx
from typing import Protocol, NamedTuple
from datetime import datetime, timezone

class RawMint(NamedTuple):
    mint: str
    name: str
    symbol: str
    lore: str | None
    image_url: str | None
    creator: str | None
    launched_at: datetime
    chain: str = "solana"
    launchpad: str | None = None

class MintSource(Protocol):
    async def fetch_since(self, cursor: datetime) -> list[RawMint]:
        """Fetches newly created Solana mints since the given cursor timestamp."""
        ...

SOLANA_BASE58_REGEX = re.compile(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$")

def is_valid_solana_mint(addr: str) -> bool:
    """Validate that an address is a Base58 Solana public key (32-44 chars)."""
    return bool(addr and SOLANA_BASE58_REGEX.match(addr))

def derive_smart_token_name_and_symbol(header: str, lore: str, addr: str) -> tuple[str, str]:
    # 1. Use header if present and valid
    if header and not header.startswith("http"):
        header_clean = header.strip()
        dollar_match = re.search(r'\$([A-Za-z0-9]{2,8})', header_clean)
        sym = dollar_match.group(1).upper() if dollar_match else header_clean[:6].upper()
        return header_clean[:40], sym

    # 2. Extract $TICKER or first 3-4 words from lore
    if lore and not lore.startswith("http"):
        lore_clean = lore.strip()
        dollar_match = re.search(r'\$([A-Za-z0-9]{2,8})', lore_clean)
        sym = dollar_match.group(1).upper() if dollar_match else None

        first_line = lore_clean.split(".")[0].split("\n")[0].strip()
        words = [w for w in first_line.split() if not w.startswith("http") and not w.startswith("$") and len(w) > 1]
        
        if words:
            derived_name = " ".join([w.capitalize() for w in words[:4]])
            if not sym:
                sym = words[0][:6].upper()
            return derived_name[:40], sym

    # 3. Fallback to readable Solana name
    short_key = addr[:6].upper()
    return f"Solana Token #{short_key[-4:]}", f"SOL{short_key[-3:]}"

class SolanaDexScreenerMintSource:
    """
    Production Solana Scanner (WEIR River Ingestion):
    Scans active and newly launched tokens on Solana via DexScreener API and profiles.
    """
    def __init__(self, target_chain: str = "solana"):
        self.target_chain = target_chain
        self.dexscreener_profiles = "https://api.dexscreener.com/token-profiles/latest/v1"
        self.dexscreener_boosts = "https://api.dexscreener.com/token-boosts/latest/v1"
        self.scanned_history: dict[str, float] = {}

    async def fetch_since(self, cursor: datetime | None) -> list[RawMint]:
        mints: list[RawMint] = []
        seen_mints: set[str] = set()

        now_ts = datetime.now(timezone.utc).timestamp()
        # Clean up history older than 300s (5 minutes)
        self.scanned_history = {m: ts for m, ts in self.scanned_history.items() if now_ts - ts < 300.0}

        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Fetch from DexScreener Latest Token Profiles (filter for Solana)
            try:
                res_dex = await client.get(self.dexscreener_profiles)
                if res_dex.status_code == 200:
                    data = res_dex.json()
                    for item in data:
                        chain_id = (item.get("chainId") or "").lower()
                        token_addr = item.get("tokenAddress") or ""
                        
                        # Only accept Solana mints
                        if chain_id != "solana" and not is_valid_solana_mint(token_addr):
                            continue

                        if not token_addr or token_addr in seen_mints or token_addr in self.scanned_history:
                            continue

                        header_val = item.get("header") or ""
                        lore_val = item.get("description") or ""
                        
                        clean_name, clean_sym = derive_smart_token_name_and_symbol(header_val, lore_val, token_addr)

                        launchpad = "pumpfun" if token_addr.endswith("pump") else "raydium"

                        seen_mints.add(token_addr)
                        self.scanned_history[token_addr] = now_ts
                        mints.append(RawMint(
                            mint=token_addr,
                            name=clean_name,
                            symbol=clean_sym,
                            lore=lore_val,
                            image_url=item.get("icon"),
                            creator=None,
                            launched_at=datetime.now(timezone.utc),
                            chain="solana",
                            launchpad=launchpad
                        ))
            except Exception:
                pass

            # 2. Fetch from DexScreener Latest Boosted Tokens (filter for Solana)
            try:
                res_boost = await client.get(self.dexscreener_boosts)
                if res_boost.status_code == 200:
                    data = res_boost.json()
                    for item in data:
                        chain_id = (item.get("chainId") or "").lower()
                        token_addr = item.get("tokenAddress") or ""

                        if chain_id != "solana" and not is_valid_solana_mint(token_addr):
                            continue

                        if not token_addr or token_addr in seen_mints or token_addr in self.scanned_history:
                            continue

                        desc_val = item.get("description") or ""
                        clean_name, clean_sym = derive_smart_token_name_and_symbol("", desc_val, token_addr)
                        launchpad = "pumpfun" if token_addr.endswith("pump") else "raydium"

                        seen_mints.add(token_addr)
                        self.scanned_history[token_addr] = now_ts
                        mints.append(RawMint(
                            mint=token_addr,
                            name=clean_name,
                            symbol=clean_sym,
                            lore=desc_val,
                            image_url=item.get("icon"),
                            creator=None,
                            launched_at=datetime.now(timezone.utc),
                            chain="solana",
                            launchpad=launchpad
                        ))
            except Exception:
                pass

        # 3. Enrich newly discovered mints with REAL token names & symbols from DexScreener Tokens API
        if mints:
            try:
                addr_list = [m.mint for m in mints]
                chunks = [addr_list[i:i + 30] for i in range(0, len(addr_list), 30)]
                real_meta: dict[str, tuple[str, str]] = {}

                async with httpx.AsyncClient(timeout=8.0) as dex_client:
                    for chunk in chunks:
                        addrs_str = ",".join(chunk)
                        r = await dex_client.get(f"https://api.dexscreener.com/latest/dex/tokens/{addrs_str}")
                        if r.status_code == 200:
                            pairs = r.json().get("pairs") or []
                            for p in pairs:
                                bt = p.get("baseToken") or {}
                                b_addr = bt.get("address")
                                b_name = bt.get("name")
                                b_sym = bt.get("symbol")
                                if b_addr and b_name and not b_name.startswith("http"):
                                    real_meta[b_addr] = (b_name, b_sym or b_name[:6].upper())

                enriched_mints = []
                for m in mints:
                    if m.mint in real_meta:
                        real_n, real_s = real_meta[m.mint]
                        enriched_mints.append(m._replace(name=real_n, symbol=real_s))
                    else:
                        enriched_mints.append(m)
                mints = enriched_mints
            except Exception:
                pass

        return mints

def get_default_mint_source() -> MintSource:
    """Returns the primary configured MintSource for Solana."""
    from app.core.config import settings
    return SolanaDexScreenerMintSource(settings.DEFAULT_CHAIN)

# Aliases for legacy compatibility
SolanaGlobalDexMintSource = SolanaDexScreenerMintSource
RobinhoodChainDexScreenerMintSource = SolanaDexScreenerMintSource
