'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEmileStore } from '@/store/useEmileStore';

const CODE_BLOCKS = [
  {
    stage: 'scan · dexscreener',
    src: `# backend/app/services/mint_source.py
async def fetch_since(self, cursor: datetime) -> list[RawMint]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        res_dex = await client.get(self.dexscreener_profiles)
        if res_dex.status_code == 200:
            for item in res_dex.json():
                chain_id = (item.get("chainId") or "").lower()
                token_addr = item.get("tokenAddress") or ""

                # Solana only: every other chain is skipped
                if chain_id != "solana":
                    continue
                if token_addr in seen_mints or token_addr in self.scanned_history:
                    continue
                ...
                mints.append(RawMint(mint=token_addr, name=clean_name,
                                     symbol=clean_sym, lore=lore_clean,
                                     launched_at=block_time,
                                     chain="solana"))`
  },
  {
    stage: 'pricing · dexscreener',
    src: `# backend/app/services/dexscreener.py
chunks = [mint_addresses[i:i + 30] for i in range(0, len(mint_addresses), 30)]

for chunk in chunks:
    url = f"{self.base_url}/tokens/v1/solana/{','.join(chunk)}"
    while retries <= max_retries and not success:
        res = await client.get(url)
        if res.status_code == 200:
            for pair in res.json() or []:
                mint = pair["baseToken"].get("address")
                fdv = float(pair.get("fdv") or pair.get("marketCap") or 0.0)
                if mint and fdv > 0:
                    prev_mc = results.get(mint, {}).get("mc", 0.0)
                    results[mint] = {"mc": max(prev_mc, fdv), ...}
            success = True
        elif res.status_code in [429, 500, 502, 503, 504]:
            retries += 1
            await asyncio.sleep((2 ** retries) + random.random() * 0.5)`
  },
  {
    stage: 'upsert · peak cap',
    src: `# backend/app/services/ingest_worker.py
# peak only ever goes up: a token that touched 30K has cleared the falls
INSERT INTO tokens (mint, chain, name, symbol, lore, peak_mc, label, ...)
VALUES (:mint, 'solana', :name, :symbol, :lore, :peak_mc,
        CASE WHEN :peak_mc >= 30000.0 THEN 'cleared' ELSE 'open' END, ...)
ON CONFLICT (mint) DO UPDATE SET
    peak_mc      = GREATEST(tokens.peak_mc, EXCLUDED.peak_mc),
    last_seen_mc = EXCLUDED.last_seen_mc,
    label = CASE
        WHEN GREATEST(tokens.peak_mc, EXCLUDED.peak_mc) >= 30000.0 THEN 'cleared'
        ELSE tokens.label
    END,
    entered_at = CASE
        WHEN tokens.entered_at IS NULL AND EXCLUDED.peak_mc >= 10000.0 THEN :now
        ELSE tokens.entered_at
    END
RETURNING (xmax = 0) AS is_new;`
  },
  {
    stage: 'labeling · 48h',
    src: `# backend/app/services/holder_sampler.py
async def run_label_worker_cycle(db: AsyncSession) -> dict:
    cutoff = text("NOW() - INTERVAL '48 hours'")
    query = select(Token).where(
        Token.label == Label.open,
        Token.entered_at <= cutoff
    ).limit(100)

    for token in (await db.execute(query)).scalars().all():
        # 1. Sample holders ONCE at the 48h mark (Helius DAS)
        token.holders_48h = await count_holders_das(token.mint)
        token.labeled_at = now

        # 2. Cleared the falls, or held below
        if float(token.peak_mc) >= 30000.0:
            token.label = Label.cleared
        else:
            token.label = Label.held

    await db.commit()`
  }
];

function fmtMC(v: number): string {
  return '$' + (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'K';
}

function fmtTime(t: any): string {
  const d = new Date(t.entered_at || t.launched_at || 0);
  if (isNaN(d.getTime()) || !d.getTime()) return '--:-- UTC';
  return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC';
}

function hueOf(s: string): number {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export const CountingFeed: React.FC = () => {
  const tokens = useEmileStore((state) => state.tokens);
  const counters = useEmileStore((state) => state.counters);
  const tally = useEmileStore((state) => state.tally);
  const isConnected = useEmileStore((state) => state.isConnected);

  const [paused, setPaused] = useState(false);
  const [blockIndex, setBlockIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const currentBlock = CODE_BLOCKS[blockIndex];
    if (charIndex < currentBlock.src.length) {
      const timeout = setTimeout(() => {
        setCharIndex((prev) => prev + 3);
        if (codeRef.current) {
          codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
      }, 18);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setBlockIndex((prev) => (prev + 1) % CODE_BLOCKS.length);
        setCharIndex(0);
      }, 1800);
      return () => clearTimeout(timeout);
    }
  }, [blockIndex, charIndex, paused]);

  const currentCode = CODE_BLOCKS[blockIndex].src.slice(0, charIndex);

  return (
    <div className="screen band">
      {/* Top Bar */}
      <div className="scr-bar">
        <span className={`lamp ${isConnected ? 'lamp-active bg-[var(--live)]' : 'bg-[var(--stall)]'}`} />
        <span className="scr-title">LIVE SOLANA INGESTION STREAM</span>
        <span className="stage">{CODE_BLOCKS[blockIndex].stage}</span>
        <button
          type="button"
          className="pause"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Code Terminal Box */}
      <div className="code" ref={codeRef}>
        <pre style={{ margin: 0, font: 'inherit', color: 'inherit' }}>
          {currentCode}
          {!paused && <span className="cur" />}
        </pre>
      </div>

      {/* Pull / Ingestion Metrics */}
      <div className="pull">
        <span>Entered River: <b style={{ color: 'var(--live)' }}>{tally.all.toLocaleString('en-US')}</b></span>
        <span>Price Updates: <b style={{ color: 'var(--live)' }}>{counters.dex.toLocaleString('en-US')}</b></span>
        <span>Holder Accounts: <b style={{ color: 'var(--live)' }}>{counters.rpc.toLocaleString('en-US')}</b></span>
      </div>

      {/* Live Token Feed List */}
      <div className="feedbox">
        <div className="feedin">
          {tokens.length === 0 ? (
            <div className="feed-empty">
              <svg width="64" height="28" viewBox="0 0 64 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                <path d="M2 18c6-5 10-5 16 0s10 5 16 0 10-5 16 0 8 4 12 2" />
                <path d="M2 25c6-4 10-4 16 0s10 4 16 0 10-4 16 0 8 3 12 1" opacity=".5" />
                <path d="M24 9c5-6 13-7 19-3-5 2-11 3-19 3z" fill="currentColor" stroke="none" opacity=".7" />
              </svg>
              The river is quiet.
              <small style={{ display: 'block', marginTop: '6px' }}>Waiting for the first Solana token to cross $10K</small>
            </div>
          ) : (
            tokens.slice(0, 100).map((t, i) => {
              const isCleared = t.status === 'passed';
              const isHeld = t.status === 'stalled';
              const badgeClass = isCleared ? 'b-pass' : isHeld ? 'b-stall' : 'b-pend';
              const badgeLabel = isCleared ? '● 30K+' : isHeld ? '· held' : '◦ in river';
              const sym = t.symbol || '?';

              return (
                <div key={t.mint || i} className={`trow ${i === 0 ? 'trow-new' : ''}`}>
                  <div className="lg" style={{ background: `hsl(${hueOf(t.mint)} 22% 82%)` }}>
                    {sym.slice(0, 2)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="nm">{t.name || 'Solana Token'}</span>
                    <a
                      className="sy"
                      href={`https://dexscreener.com/solana/${encodeURIComponent(t.mint || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${sym} ↗
                    </a>
                    <div className="lore">
                      {t.lore_withheld ? '[lore withheld]' : t.lore || 'No lore description provided.'}
                    </div>
                  </div>
                  <div
                    className="num"
                    style={{ color: t.holders == null ? 'var(--faint)' : 'var(--live)' }}
                    title={t.holders == null ? 'Holders are sampled once, 48h after entry' : undefined}
                  >
                    {t.holders == null ? '-' : t.holders.toLocaleString('en-US')}
                  </div>
                  <div className="num hide-sm" style={{ color: 'var(--live)' }}>
                    {fmtMC(Number(t.peak_mc) || 0)}
                    <div className="tt">{fmtTime(t)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
