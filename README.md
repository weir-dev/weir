# WEIR — Autonomous Solana Token Counting Station

> **WEIR** is an autonomous machine learning counting station that observes every Solana SPL token that enters the river (**$10,000 peak market cap**) and counts which tokens swim upstream to **clear the falls ($30,000 peak market cap)** versus those **held below (stalled at 48 hours)**. WEIR publishes its live counts, mathematical proofs, and datasets completely openly.

[![X / Twitter](https://img.shields.io/badge/X-@weircount-000000?style=for-the-badge&logo=x)](https://x.com/weircount)

**Network:** Solana Mainnet  
**Token:** $WEIR (`[ADDED AT LAUNCH]`)  
**Research Engine:** Machine Learning Binary Classification (LightGBM) with VC Capacity Penalty and Four Locks  
**Mascot:** Kip the Salmon

WEIR does **not** open its token launch gate until its model's proven performance floor clears **ROC-AUC 0.60** with all **Four Locks** passed. That threshold is enforced strictly by statistical learning theory in code. The water gauge (*papan duga air*) and weir gates on the dashboard serve as the physical and visual representation of that strict mathematical barrier.

---

## ⚠️ What WEIR Is & What It Is Not

### What WEIR Is
* A conditional probability estimator answering: *"Given a token entered the river ($10K peak market cap), what is the probability it clears the falls ($30K peak market cap)?"*
* A 100% transparent, open-data counting station publishing raw labeled CSV datasets (`/api/dataset.csv` → `weir_solana_dataset.csv`) and machine-readable methodology specifications (`/api/methodology.json`).
* An automated pipeline enforcing Vapnik–Chervonenkis (VC) capacity bounds, bootstrap lower confidence limits, and Four Locks.

### What WEIR Is Not
* **WEIR does not predict price.**
* **WEIR counts survival, not price. It is a research tool, not financial advice.**
* The water gauge **is not decorative**. If the model is insufficient or sample size is thin, the weir gates remain closed, water level is capped at 0.95, and the site explicitly names the lock holding the gate (`held_by_lock`).

---

## 🌊 River Terminology Guide

| Previous Term | WEIR River Concept | Technical Key |
|---|---|---|
| Tracked token | **Entered the river** | `entered` / `entered_at` (peak MC $\ge \$10\text{K}$) |
| Passed $30K | **Cleared the falls** | `cleared` (peak MC $\ge \$30\text{K}$) |
| Stalled 48h | **Held below** | `held` (age $\ge 48\text{h}$, never cleared $\$30\text{K}$) |
| Sand level / jar level | **Water level at the gate** | `gate_level` ($0.0 \dots 1.0$) |
| Proof gates | **Four Locks** | `locks`: `lock_samples`, `lock_cleared`, `lock_stability`, `lock_no_lookahead` |
| Blocked by | **Lock holding** | `held_by_lock` |
| Mascot | **Kip the salmon** | Swimming upstream past the weir |
| Gauges | **Staff water gauge** (*papan duga air*) | 3D Interactive Three.js cylinder gauge |

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SOLANA DATA SOURCES                           │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │ Solana Token Mints   │  │ DexScreener API     │  │ Helius DAS RPC │  │
│  │ (Ingest Worker)      │  │ (Market Cap Poller) │  │ (48h Holders)  │  │
│  └──────────┬───────────┘  └──────────┬──────────┘  └───────┬────────┘  │
└─────────────┼─────────────────────────┼─────────────────────┼───────────┘
              │                         │                     │
┌─────────────▼─────────────────────────▼─────────────────────▼───────────┐
│                            WORKER LAYER (Python 3.11)                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐    │
│  │ Ingest Worker    │ │ 48h Label Worker │ │ Lore Moderation      │    │
│  │ (Solana DEX 60s) │ │ (every 15m)      │ │ (on ingest)          │    │
│  └──────────┬───────┘ └──────────┬───────┘ └───────────┬──────────┘    │
│             │                    │                     │                │
│             │         ┌──────────▼────────┐            │                │
│             │         │ ML Model Worker   │            │                │
│             │         │ (LightGBM Job)    │            │                │
│             │         └──────────┬────────┘            │                │
│             │                    │                     │                │
└─────────────┼────────────────────┼─────────────────────┼────────────────┘
              │                    │                     │
              ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DATA & EVENT BUS LAYER                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ PostgreSQL 15+                      │  │ Redis 7.x (Pub/Sub)      │  │
│  │ (Tokens, Daily Universe, Model Runs)│  │ (Live Event Streaming)   │  │
│  └─────────────────────────────────────┘  └────────────┬─────────────┘  │
└────────────────────────────────────────────────────────┼────────────────┘
                                                         │
┌────────────────────────────────────────────────────────▼────────────────┐
│                         API LAYER (FastAPI)                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ REST (/api/state, /api/gate, /api/dataset.csv, ...)               │  │
│  │ WebSocket Server (wss://.../stream)                               │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────┐
│                       FRONTEND LAYER (Next.js 16 / App Router)          │
│  ┌──────────────────────────┐ ┌──────────────────┐ ┌─────────────────┐ │
│  │ River Hero Scene (Kip)   │ │ 3D Water Gauge   │ │ Four Locks Panel│ │
│  │ Riverbed & Coral Theme   │ │ (Three.js Staff) │ │ (/ladder, /runs)│ │
│  └──────────────────────────┘ └──────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Function |
|---|---|---|
| **Backend** | Python 3.11 + FastAPI | Async ASGI server, REST endpoints & WebSocket broadcaster. |
| **ML Engine** | `LightGBM`, `scikit-learn`, `sentence-transformers` | 5-Fold Stratified CV, MiniLM-L6-v2 embedding -> PCA 24 dims. |
| **Database** | PostgreSQL 15+ + SQLAlchemy 2.0 Async | Schema for Solana mints, `entered_at`, `holders_48h`, `label`, `gate_level`. |
| **Cache & Bus** | Redis 7.x | Pub/Sub realtime event streaming & in-memory state caching. |
| **Frontend** | Next.js 16 (App Router) + Three.js | Riverbed/Coral/Mist palette, 3D interactive staff water gauge, live stream. |

---

## 🧮 Machine Learning & Mathematical Formulations

### 1. Feature Families (Capacity $d = 37$)
1. `launch_hour`: $\sin$ / $\cos$ encoding of UTC hour-of-day (2 columns).
2. `launch_dow`: One-hot encoded day-of-week (7 columns).
3. `holders`: $\log(1 + \text{holders})$ sampled ONCE at 48-hour mark via Solana RPC / Helius DAS.
4. `lore`: Text embedding (`MiniLM-L6-v2`) reduced via PCA to 24 dimensions + `lore_len` + `lore_missing` + `name_tokens` (28 columns).

### 2. Proven Performance Floor Formula
$$\text{proven}_{\text{floor}} = \min(\text{floor}_{\text{VC}}, \text{floor}_{\text{boot}})$$

Where:
* **VC Capacity Penalty**:
  $$\epsilon_{\text{VC}} = \sqrt{\frac{d(\ln(2n/d) + 1) + \ln(4/\delta)}{n}}$$
  $$\text{floor}_{\text{VC}} = \text{AUC}_{\text{mean}} - \epsilon_{\text{VC}}$$
* **Bootstrap Lower Bound**:
  $$\text{floor}_{\text{boot}} = \text{Percentile}_{2.5}(\text{Bootstrap}_{\text{AUCs}})$$
* **Water Level at the Gate**:
  $$\text{gate}_{\text{level}} = \text{clamp}\left(\frac{\text{proven}_{\text{floor}} - 0.50}{0.60 - 0.50}, 0.0, 1.0\right)$$

### 3. Four Locks Verification
All 4 locks must hold for `gate_level` to reach `1.0`. If any lock fails, `gate_level` is capped at `0.95` and `held_by_lock` publishes the lock holding the gate:
* **`lock_samples`**: $n \ge 2000$ labeled tokens entered the river.
* **`lock_cleared`**: $n_{\text{cleared}} \ge 200$ tokens cleared the falls.
* **`lock_stability`**: $\sigma_{\text{AUC}} < 0.05$ cross-validation stability.
* **`lock_no_lookahead`**: temporal CV gap $\le 0.04$ (sanity check against lookahead data leakage).

---

## 🚀 Routes & Pages

* `/` — The River: Live counts, Kip hero, 3D water gauge, active stream, overview stats.
* `/window` — Counting Window: live Solana ingestion feed with search and status chips.
* `/ladder` — The Ladder: stream breakdown, Four Locks inspection, feature weights.
* `/math` — Gate Math: theoretical foundations, VC capacity penalty, interactive simulation.
* `/runs` — Runs: 30-day model convergence log with historical gates & metrics.
* `/token` — $WEIR Token: launch gate status, contract address details, disclaimers.
* `/about` — About: the river story, Solana SPL migration rationale, open research ethos.

---

## 🔌 API Contract Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/state` | Full snapshot: latest 400 tokens, counters (`entered`, `cleared`, `held`, `open`), latest model. |
| `GET` | `/api/gate` | Current gate state: `proven_floor`, `gate_level`, `locks`, `held_by_lock`. |
| `GET` | `/api/model/history?days=30` | 30-day model runs history array for convergence visualization. |
| `GET` | `/api/methodology.json` | Machine-readable methodology specification for Solana SPL. |
| `GET` | `/api/dataset.csv` | **Public downloadable labeled dataset CSV** (`weir_solana_dataset.csv`). |
| `WS` | `/stream` | Realtime event stream (`entered`, `cleared`, `held`, `counters`, `model`). |

---

## 📄 License & Disclaimer

* **Disclaimer**: WEIR counts survival, not price. It is a research tool, not financial advice. Four feature families cannot forecast market anomalies. This platform rigorously measures historical survival probabilities under statistical capacity bounds, not price targets.
