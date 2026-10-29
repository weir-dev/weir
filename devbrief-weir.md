# WEIR — Dev Brief

> Rebrand total **Epoch Labs → WEIR ($WEIR)** dan migrasi **Robinhood Chain → Solana**.
> Mesin ML dan matematika gerbang **tidak berubah**. Yang berubah: chain, data ingest, nama, visual, copy, dan istilah.

| | |
|---|---|
| Repo lama | `github.com/epochlabshq/EpochLabs` |
| Situs lama | `epochlabs.run` |
| Nama baru | **WEIR** |
| Ticker | **$WEIR** (Solana SPL) |
| Domain (kandidat, cek dulu) | `weir.run`, `weircount.xyz`, `weir.fun` |
| X handle (kandidat, cek dulu) | `@weircount`, `@weirsol` |
| Desain referensi | Canvas "WEIR Rebrand" (brand board, glossary, landing, X header) |
| Status | Brief v1 · 27 Okt 2026 |

---

## 1. Konsep dalam satu paragraf

Weir adalah bendungan rendah di sungai, tempat ahli biologi menghitung salmon yang berenang ke hulu. WEIR melakukan hal yang sama di Solana: setiap token yang melewati **$10K peak market cap** *masuk sungai*. Agent mengamati dan belajar token mana yang *melompati air terjun* (**$30K peak market cap**) dan mana yang *tertahan di bawah* (mandek setelah 48 jam). Semua hitungan dipublikasikan live. **$WEIR tidak launch sesuai jadwal.** Gerbang hanya terbuka ketika proven floor model ≥ **AUC 0.60** dan keempat kunci terpenuhi.

**Tagline utama:** *Thousands enter the river. Few clear the falls. We count every one.*
**Tagline pendek:** *Few clear the falls.*

**Yang WEIR bukan:** bukan prediktor harga, bukan sinyal beli, bukan financial advice. WEIR mengukur peluang *survival*, bukan harga.

---

## 2. Scope

### Dikerjakan
1. Migrasi pipeline data dari Robinhood Chain (EVM) ke Solana.
2. Rebrand frontend secara total: nama, logo, warna, font, maskot, copy, istilah, dan route.
3. Rename istilah di API, DB, dan kode (dengan alias kompatibilitas bila perlu).
4. Dataset baru dari nol khusus Solana (data Robinhood **tidak** dicampur).
5. Persiapan launch $WEIR yang dikunci oleh gerbang matematika.

### Tidak dikerjakan (tetap sama)
- Model: LightGBM, 5-fold stratified CV, 4 feature family, d = 28.
- Rumus proven floor, VC bound, bootstrap, dan empat gate.
- Stack: FastAPI, PostgreSQL 15+, Redis 7, Next.js 16, Zustand.

---

## 3. Peta istilah (wajib konsisten di UI, API, dan docs)

| Arti | Lama (Epoch Labs) | Baru (WEIR) | Key di kode/API |
|---|---|---|---|
| Token ≥ $10K | Tracked token | **Entered the river** | `entered` |
| Tembus $30K | Passed $30K / positive class | **Cleared the falls** | `cleared` |
| Mandek, umur ≥ 48h | Stalled / negative class | **Held below** | `held` |
| Level gerbang launch | Hourglass / sand level / jar level | **Water level at the gate** | `gate_level` |
| 4 hard gates | Proof gates g1–g4 | **Four Locks** | `locks` |
| Gate yang gagal | `blocked_by` | **Lock holding** | `held_by_lock` |
| AUC − ε floor | VC proof floor | **Proven floor** (tetap) | `proven_floor` |
| Halaman live ingest | Console | **Counting Window** | `/window` |
| Halaman model | Brain | **The Ladder** | `/ladder` |
| Halaman matematika | The Math | **The Math** (tetap) | `/math` |
| Riwayat model | Epochs | **Runs** | `/runs` |
| Maskot | Sandstone golem | **Kip** si salmon | — |
| Objek ikon gerbang | Jam pasir | **Papan duga air** (staff gauge) | — |
| Token | $EPC (Robinhood) | **$WEIR** (Solana) | — |

> Halaman **Desk**, **GoForge**, dan **Radar** dari situs lama: putuskan dulu apakah ikut dipindah (lihat §12 Open questions). Kalau ikut, beri nama yang sesuai tema sungai, misalnya Radar → **Sonar**.

---

## 4. Brand system

### 4.1 Logo
- **Mark:** salmon coral yang melompati **tiga tiang penghitung** (weir stakes), dengan satu garis air tipis di bawahnya.
- **Wordmark:** `WEIR` dalam Bricolage Grotesque 800, letter-spacing −0.05em.
- **Varian:**
  - Primary: mark dengan tiang Mist dan ikan Coral di atas latar Riverbed.
  - Light: tiang Riverbed dan ikan Coral di atas latar Mist.
  - Avatar/PFP: latar Coral, tiang Riverbed, dan ikan putih.
- **Ukuran minimum:** mark 24px, lockup 96px lebar.
- **Jangan:** memakai gradient, drop shadow, atau memutar mark.
- Source SVG (viewBox 64×64) ada di canvas artboard *Brand board*. Export ke `frontend/public/brand/weir-mark.svg`, `weir-mark-light.svg`, `weir-avatar.svg`, dan `og.png` (1200×630).

### 4.2 Warna

| Token | Hex | Pakai untuk |
|---|---|---|
| `--riverbed` | `#10211F` | Ink utama, panel gelap |
| `--riverbed-2` | `#1C3833` | Kartu di atas panel gelap |
| `--run-coral` | `#FF7A4D` | Aksen, ikan, CTA, garis 0.60 |
| `--deep-coral` | `#B43A16` | Teks coral kecil di latar terang (kontras ≥ 4.5:1) |
| `--weir-moss` | `#5E8C7E` | Air, data netral, garis sungai |
| `--moss-muted` | `#9FB8AE` | Label sekunder di latar gelap |
| `--shallows` | `#DCE6DF` | Panel terang sekunder |
| `--mist` | `#EEF1EA` | Background terang |
| `--ink-2` | `#24413A` | Body text sekunder di latar terang |
| `--ink-3` | `#4A5E58` | Label kecil di latar terang |
| `--line` | `#C9D3CC` | Border di latar terang |

Aturan:
- Coral `#FF7A4D` hanya untuk teks besar (≥ 24px) atau grafis di latar terang. Untuk teks kecil pakai `--deep-coral`.
- Status data: **cleared** = Coral, **held** = Moss Muted, **entered** = Mist/Riverbed. Jangan hanya bedakan dengan hue; pakai juga label atau ikon.
- Dukung dark dan light mode. Default: hero dan Counting Window gelap, konten lain terang (lihat canvas Landing).

### 4.3 Tipografi
- **Bricolage Grotesque** (Google Fonts, `opsz 12..96`, wght 400/600/800): untuk display dan body.
- **JetBrains Mono** (400/600): untuk angka, matematika, address, label caps.
- Label caps: mono 12–14px, letter-spacing 0.14em.
- Semua angka live memakai `font-variant-numeric: tabular-nums`.
- Muat font via `next/font/google` (jangan `<link>` manual).

### 4.4 Maskot: Kip
- Salmon jantan berahang kait (*kype*), geometris dan flat (gaya sama dengan mark).
- **Atribut:** memegang **tally clicker**, berdiri/berenang di samping **papan duga air**.
- **Kepribadian:** pencatat yang teliti, sabar, dan sedikit kering humornya. Ia menghitung dan tidak pernah menebak harga.
- **Pose yang dibutuhkan:** idle (menunggu di bawah air terjun), counting (klik clicker), leap (gerbang terbuka / launch), held (duduk di bawah, untuk empty state).
- **Pengganti video golem:** loop SVG/Lottie ringan (≤ 300KB) dan tidak memakai MP4 besar. Wajib hormati `prefers-reduced-motion`.

### 4.5 Papan duga air (pengganti jam pasir)
Komponen visual utama gerbang launch.
- Tiang vertikal berskala 0.50 → 0.70 (tick tiap 0.01, label tiap 0.05).
- Garis **0.60** berwarna Coral dengan label `opens at 0.60`.
- Tinggi air = `gate_level` (0–1), dipetakan dari proven floor.
- Di samping tiang ada **empat gembok kecil** (Lock 1–4) yang terbuka atau tertutup sesuai status.
- Selama ada lock yang belum terpenuhi, air **berhenti di 95%** dan nama lock yang menahan ditampilkan (`held_by_lock`). Ini sama dengan perilaku `blocked_by` lama.

### 4.6 Voice & copy
- Kalimat pendek dan faktual, dengan metafora sungai yang **konsisten tapi tidak berlebihan**.
- Selalu jujur soal ketidakpastian. Kalau data belum cukup, katakan saja.
- Hindari: "moon", "100x", "alpha", "guaranteed", dan janji harga.
- Contoh empty state: *"The river is quiet. No token has crossed $10K yet today."*
- Contoh gate tertutup: *"Water is at 0.54. Lock 1 is holding: 812 of 2,000 tokens counted."*

---

## 5. Sitemap & halaman

| Route | Nama | Isi |
|---|---|---|
| `/` | Home | Hero + ilustrasi sungai, strip Counting Window ringkas, "How the count works" (Enter / Swim / Leap or hold), papan duga + Four Locks, footer disclaimer + CA |
| `/window` | Counting Window | Feed live token yang masuk sungai (WebSocket), counter entered/cleared/held, median holders, filter status |
| `/ladder` | The Ladder | Riwayat model, feature importance, ROC-AUC, info model run terakhir |
| `/math` | The Math | Rumus lengkap (KaTeX), slider interaktif n/d/AUC → ε → floor |
| `/runs` | Runs | Grafik AUC dan proven floor dari waktu ke waktu (`/api/model/history`) |
| `/about` | About | Cerita weir, apa WEIR dan apa yang bukan, metodologi, link dataset |
| `/token` | $WEIR | Status gerbang, CA (setelah launch), tokenomics placeholder, disclaimer |

Redirect 301 dari route lama: `/console → /window`, `/brain → /ladder`, `/epochs → /runs`.

### Komponen frontend (rename)

| Lama | Baru |
|---|---|
| `HeroScene` (video golem) | `RiverHero` (SVG + Kip loop) |
| `CrtTerminal` | `CountingFeed` (tanpa efek CRT/scanline) |
| `ProofPanel` | `GaugePanel` (papan duga + Four Locks) |
| `StatsStrip` | `CountStrip` |
| `HeaderBar` / `FooterBar` | `SiteHeader` / `SiteFooter` |

Hapus: `styles/` CRT scanline, `public/videos/Stone_golem_types_at_keyboard.mp4`, `epoch-logo.png`, dan seluruh token warna amber/espresso.

### Persyaratan UI
- Responsif sampai 360px. Nav menjadi menu di mobile, dan tabel scroll horizontal di dalam box.
- Target sentuh ≥ 44px, fokus keyboard terlihat, dan `aria-label` di tombol ikon.
- SVG dekoratif `aria-hidden`, sedangkan ilustrasi bermakna diberi `role="img"` dan label.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95 di mobile.
- Angka live tidak boleh menimbulkan layout shift (lebar tetap + tabular nums).
- Data yang belum ada ditampilkan sebagai `—`. **Jangan pernah tampilkan angka dummy di produksi.**

---

## 6. Backend: migrasi ke Solana

### 6.1 Ringkasan perubahan

| Bagian | Robinhood (lama) | Solana (baru) |
|---|---|---|
| Address | `0x…` hex, 20 byte | Base58 mint, 32–44 karakter |
| Sumber token baru | Ingest worker Robinhood mints | Mint baru dari launchpad Solana (lihat 6.2) |
| Market cap | DexScreener (chain robinhood) | DexScreener `chainId = solana` |
| Holders | Chain RPC (EVM) | Helius DAS `getTokenAccounts` per mint (atau RPC `getProgramAccounts` sebagai fallback) |
| Lore | Metadata token EVM | Metaplex metadata (name, symbol, URI → JSON description) |

### 6.2 Ingest worker (tiap 60 detik)
1. Ambil kandidat token baru di Solana. **Opsi yang bisa dipilih (putuskan di §12):**
   - (a) Helius webhook/Enhanced Transactions untuk event create token di program launchpad (pump.fun, dll.) → paling real-time.
   - (b) Polling DexScreener (profil/pair terbaru di `solana`) → paling sederhana, tapi bisa melewatkan token.
   - (c) Kombinasi: (a) untuk discovery, DexScreener untuk harga.
2. Batch poll market cap via DexScreener untuk token yang sedang dipantau. Patuhi rate limit, gunakan backoff, dan batch maksimal sesuai limit endpoint.
3. Simpan `peak_mc` (bukan mc saat ini). Token **masuk sungai** saat `peak_mc ≥ 10_000` pertama kali, dan catat `entered_at`.
4. Abaikan token tanpa pool likuiditas yang valid. Dedupe per mint, dan tangani pair ganda (ambil pair dengan likuiditas terbesar).

### 6.3 Label worker (tiap 15 menit)
- `cleared` jika `peak_mc ≥ 30_000` kapan pun setelah masuk.
- `held` jika umur ≥ 48 jam sejak `entered_at` dan belum cleared.
- Selain itu `open` (belum dilabel, tidak dipakai training).

### 6.4 Holder sampler
- Ambil jumlah holder **sekali saja** di tanda 48 jam (sama dengan aturan lama, untuk mencegah leakage).
- Hitung hanya akun dengan saldo > 0. Kecualikan akun pool/bonding curve yang diketahui (buat daftar program/akun yang dikecualikan).
- Simpan `holders_48h`, lalu fitur `log(1 + holders_48h)`.

### 6.5 Lore safety worker
- Tetap jalan saat ingest. Sumber lore sekarang adalah Metaplex metadata JSON (`description`, `name`, `symbol`).
- Fetch URI metadata dengan timeout, batas ukuran, dan hanya http(s)/ipfs/arweave gateway. **Jangan pernah render HTML dari metadata.**
- Sanitasi sebelum tampil di Counting Window (pertahankan filter lama).

### 6.6 ML training job (tiap 1 jam), tidak berubah
- Fitur: `launch_hour` (sin/cos), `launch_dow` (one-hot 7), `log1p(holders_48h)`, `lore` (MiniLM-L6-v2 → PCA 24 + `lore_len`, `lore_missing`, `name_tokens`). Total d = 28.
- `launch_hour`/`launch_dow` diambil dari waktu create token di Solana (block time), dalam UTC.
- 5-fold stratified CV + time-split check.

### 6.7 Matematika gerbang (tetap, hanya rename)

```
ε_VC        = sqrt( ( d·(ln(2n/d) + 1) + ln(4/δ) ) / n ),   δ = 0.05
floor_VC    = AUC_mean − ε_VC
floor_boot  = Percentile_2.5(bootstrap AUCs)
proven_floor = min(floor_VC, floor_boot)

gate_level  = clamp( (proven_floor − 0.50) / (0.60 − 0.50), 0, 1 )
jika ada lock gagal: gate_level = min(gate_level, 0.95), held_by_lock = <nama lock>
```

| Lock | Syarat | Key |
|---|---|---|
| Lock 1 | n ≥ 2,000 | `lock_samples` |
| Lock 2 | cleared ≥ 200 | `lock_cleared` |
| Lock 3 | σ AUC < 0.05 | `lock_stability` |
| Lock 4 | \|AUC_cv − AUC_time\| ≤ 0.04 | `lock_no_lookahead` |

Test lama (`test_jar_math`, `test_leakage`, `test_lore_safety`) wajib tetap lulus. Rename `test_jar_math` menjadi `test_gate_math`.

---

## 7. Database

- **Database baru** `weir_db` (jangan migrasi data Robinhood ke tabel yang sama).
- Ubah tipe kolom address menjadi `TEXT` dengan validasi base58 (panjang 32–44).
- Tambah kolom: `chain` (default `'solana'`), `launchpad` (nullable), `entered_at`, `peak_mc`, `holders_48h`, `label` (`open|cleared|held`).
- Rename di tabel model runs: `jar_level → gate_level`, `blocked_by → held_by_lock`.
- Index: `(label)`, `(entered_at)`, unique `(mint)`.
- Update `DDL.sql` dan tambahkan file migrasi.

---

## 8. API

| Method | Endpoint | Catatan |
|---|---|---|
| GET | `/api/state` | Snapshot: 100 token terakhir, counters `{entered, cleared, held, median_holders}`, model run terakhir. Cache 15s |
| GET | `/api/model/history?days=30` | Untuk `/runs` |
| GET | `/api/methodology.json` | Update chain, threshold, istilah |
| GET | `/api/dataset.csv` | Dataset Solana berlabel, publik |
| GET | `/api/gate` | **Baru:** `{proven_floor, gate_level, locks:{…:bool}, held_by_lock}` |
| WS | `/stream` | Event: `entered`, `cleared`, `held`, `counters`, `model` |

Kompatibilitas: selama 30 hari, `/api/state` boleh menyertakan alias lama (`jar_level`, `blocked_by`) bersama key baru, lalu dihapus.

---

## 9. Konfigurasi & env

```
CHAIN=solana
SOLANA_RPC_URL=
HELIUS_API_KEY=
DEXSCREENER_BASE=https://api.dexscreener.com
DATABASE_URL=postgresql+asyncpg://…/weir_db
REDIS_URL=
ENTRY_MC_USD=10000
CLEAR_MC_USD=30000
HOLD_AFTER_HOURS=48
GATE_TARGET_AUC=0.60
NEXT_PUBLIC_SITE_NAME=WEIR
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_TOKEN_CA=        # kosong sampai launch
```

Secrets hanya di environment Railway/Vercel dan tidak pernah di-commit. Hapus semua env Robinhood.

---

## 10. Repo & deploy

- Rename repo/org: `epochlabshq/EpochLabs` → `weir…/weir` (nama org menunggu cek ketersediaan). GitHub otomatis membuat redirect dari nama lama.
- Rename di kode: package name, judul `<title>`, metadata OG/Twitter, `README.md`, dan Docker/Procfile service name.
- Update `canonical` dan `og:url` ke domain baru. Saat ini canonical masih menunjuk ke `epochlabs-production.up.railway.app`, jadi perbaiki.
- `epochlabs.run` → 301 ke domain WEIR (pertahankan minimal 3 bulan).
- README baru dengan judul *WEIR — Autonomous Solana Token Counting Station*, dan semua istilah memakai versi baru.

---

## 11. Launch $WEIR

- Token **tidak** dibuat atau diumumkan sebelum `gate_level = 1.0` (proven floor ≥ 0.60 **dan** semua lock terbuka).
- Halaman `/token` menampilkan status gerbang live dan CA placeholder `[ADDED AT LAUNCH]` sampai launch.
- Setelah launch: isi `NEXT_PUBLIC_TOKEN_CA`, verifikasi CA di explorer, dan tampilkan tombol copy CA.
- Token lama **$EPC** di Robinhood Chain tidak bisa dipindah. Siapkan pengumuman yang jelas bahwa $WEIR adalah token baru di chain lain (lihat §12 soal holder lama).
- Disclaimer wajib di setiap halaman: *WEIR counts survival, not price. It is a research tool, not financial advice.*

---

## 12. Open questions (perlu keputusan owner)

1. **Discovery token Solana:** opsi (a) Helius webhook, (b) polling DexScreener, atau (c) kombinasi? Launchpad mana saja yang dipantau (pump.fun saja, atau semua)?
2. **Halaman Desk, GoForge, Radar:** ikut dipindah, di-rename, atau dihapus?
3. **Holder $EPC lama:** ada program migrasi/airdrop atau tidak? (keputusan bisnis/legal)
4. **Domain & handle final:** pilih setelah cek ketersediaan.
5. **Tokenomics $WEIR:** supply, alokasi, launchpad. Belum ada; jangan diisi dengan angka karangan.
6. **Hosting:** tetap Railway (backend) + Vercel (frontend)?

---

## 13. Milestone

| # | Milestone | Isi | Selesai jika |
|---|---|---|---|
| M0 | Keputusan | Jawab §12 no. 1, 2, 4 | Owner sign-off |
| M1 | Backend Solana | Ingest, label, holder sampler, lore, DB baru | Token Solana ≥ $10K masuk DB dalam ≤ 2 menit; label benar di 20 sampel manual |
| M2 | API & rename | Endpoint + key baru, `/api/gate`, WS event baru | Semua test lulus; kontrak API sesuai §8 |
| M3 | Frontend rebrand | Brand system, halaman §5, komponen baru, redirect | Tidak ada sisa "Epoch", amber, golem, jam pasir; Lighthouse sesuai target |
| M4 | Domain & deploy | Domain, OG image, redirect 301, README | Domain live dengan HTTPS; share link X menampilkan OG WEIR |
| M5 | Data mengalir | Biarkan berjalan dan kumpulkan data | Counter naik; model run pertama tercatat di `/runs` |
| M6 | Launch | Hanya saat gerbang terbuka | `gate_level = 1.0` terverifikasi |

---

## 14. Definition of Done (rebrand)

- [ ] `grep -ri "epoch"` di frontend dan copy hanya menyisakan konteks matematika (misalnya "epoch" ML jika ada), tanpa nama brand.
- [ ] Tidak ada warna `#E99F30`, `#332311`, `#FEFAF0`, `#2A1C0D` tersisa.
- [ ] Tidak ada aset golem, jam pasir, atau CRT tersisa.
- [ ] Semua istilah UI sesuai tabel §3.
- [ ] Counter, papan duga, dan Four Locks membaca data live, tanpa dummy.
- [ ] Mobile 360px rapi, keyboard navigable, kontras lulus.
- [ ] Favicon, PFP, X header, dan OG image memakai aset WEIR.
- [ ] Disclaimer tampil di semua halaman.
- [ ] Redirect route lama dan domain lama berfungsi.

---

## 15. Aset yang perlu dibuat

| Aset | Ukuran | Sumber |
|---|---|---|
| Logo mark SVG (3 varian) | 64×64 viewBox | Canvas: Brand board |
| Wordmark + lockup SVG | — | Canvas: Brand board |
| Favicon | 32, 180 (apple), 512 | Varian avatar |
| PFP X | 400×400 | Varian avatar |
| X header | 1500×500 | Canvas: X header |
| OG image | 1200×630 | Turunan X header |
| Kip: 4 pose | SVG / Lottie | Perlu dibuat (illustrator) |
| Papan duga air | Komponen SVG/React | Dibangun di kode (§4.5) |
