'use client';

import React, { useState } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { FooterBar } from '@/components/layout/FooterBar';
import { CountingFeed } from '@/components/crt/CountingFeed';
import { CountStrip } from '@/components/analytics/CountStrip';
import { FormulaStrip } from '@/components/math/FormulaStrip';
import { EQ } from '@/config/equations';
import { useEmileDatabase } from '@/hooks/useEmileDatabase';
import { useEmileStore } from '@/store/useEmileStore';

export default function CountingWindowPage() {
  useEmileDatabase();
  const tokens = useEmileStore((state) => state.tokens);
  const tally = useEmileStore((state) => state.tally);
  const [filter, setFilter] = useState<'all' | 'pending' | 'passed' | 'stalled'>('all');
  const [search, setSearch] = useState('');

  const filteredTokens = tokens.filter((t) => {
    if (filter === 'pending' && t.status !== 'pending') return false;
    if (filter === 'passed' && t.status !== 'passed') return false;
    if (filter === 'stalled' && t.status !== 'stalled') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.symbol && t.symbol.toLowerCase().includes(q)) ||
        (t.mint && t.mint.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="wrap min-h-screen flex flex-col">
      <HeaderBar phaseText="counting window · live solana token ingest" />

      <main className="w-full flex-1 p-4 md:p-8 space-y-6">
        <div className="lp-head" style={{ paddingBottom: '16px' }}>
          <div>
            <span className="eyebrow-n"><b>01</b>Live Ingestion Stream</span>
            <h2>The Counting <em>Window</em></h2>
            <p>
              Every Solana token that touches $10K peak market cap enters the river. We monitor each token continuously until it clears $30K or stalls past 48 hours.
            </p>
          </div>
          {/* Right Side 3D Fish Mascot Card (Kip the Salmon #0342) */}
          <div className="relative group overflow-hidden rounded-2xl border border-cyan-500/25 shadow-2xl bg-gradient-to-br from-[#121B1E] via-[#0E1517] to-[#0A0E10] min-w-[300px] sm:min-w-[360px] max-w-[430px] w-full md:w-auto h-[185px] sm:h-[195px] flex items-center justify-between p-4 flex-shrink-0">
            {/* Subtle Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                backgroundSize: '14px 14px'
              }}
            />

            {/* Ambient Glow behind Kip */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-orange-500/15 blur-xl pointer-events-none" />

            {/* Left Info Column */}
            <div className="relative z-10 flex flex-col justify-between h-full py-0.5 max-w-[185px] sm:max-w-[210px]">
              {/* Top row: Status */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                    POLLING 60S · MAINNET
                  </span>
                </div>
                <h3 className="font-sans font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                  Solana DEX Stream
                </h3>
              </div>

              {/* Middle metrics */}
              <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                <span className="text-zinc-300 font-medium">Entry ≥ $10K Peak MC</span>
                <span className="text-emerald-400 font-semibold text-[10.5px]">Target Peak MC ≥ $30K</span>
              </div>

              {/* Bottom: Agent tag + Counting Pill */}
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                  AGENT #0342
                </span>
                <span className="font-mono text-[10.5px] px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10 font-bold shadow-md">
                  COUNT: {tally.all.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Right: Kip the Salmon 3D Model (Exact user image) */}
            <div className="relative z-10 h-full flex items-center justify-end flex-shrink-0 pl-2">
              <img
                src="/brand/kip-front-right.png"
                alt="Kip the Salmon (WEIR Agent #0342)"
                className="h-[148px] sm:h-[165px] w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] transition-all duration-500 ease-out group-hover:scale-108 group-hover:-translate-y-1"
              />
            </div>
          </div>
        </div>

        <CountStrip />

        {/* Live Terminal & Feed */}
        <div className="grid grid-cols-1 gap-6">
          <CountingFeed />
        </div>

        {/* Filter & Search Bar */}
        <div className="box tex border border-[var(--rule)] shadow-md" style={{ marginTop: '24px' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border-[var(--cyan)]/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-[var(--panel2)] text-[var(--dim)] border-[var(--rule)] hover:text-white'
                }`}
                onClick={() => setFilter('all')}
              >
                ● All Tokens ({tokens.length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  filter === 'pending'
                    ? 'bg-[var(--violet)]/20 text-[var(--violet)] border-[var(--violet)]/50 shadow-[0_0_12px_rgba(192,132,252,0.25)]'
                    : 'bg-[var(--panel2)] text-[var(--dim)] border-[var(--rule)] hover:text-white'
                }`}
                onClick={() => setFilter('pending')}
              >
                ◦ In River / Open ({tokens.filter((t) => t.status === 'pending').length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  filter === 'passed'
                    ? 'bg-[var(--live)]/20 text-[var(--live)] border-[var(--live)]/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-[var(--panel2)] text-[var(--dim)] border-[var(--rule)] hover:text-white'
                }`}
                onClick={() => setFilter('passed')}
              >
                ✓ Cleared $30K ({tokens.filter((t) => t.status === 'passed').length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  filter === 'stalled'
                    ? 'bg-[var(--stall)]/20 text-[var(--stall)] border-[var(--stall)]/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : 'bg-[var(--panel2)] text-[var(--dim)] border-[var(--rule)] hover:text-white'
                }`}
                onClick={() => setFilter('stalled')}
              >
                · Held Below ({tokens.filter((t) => t.status === 'stalled').length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by name, symbol, or mint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 px-3.5 rounded-lg border border-[var(--rule)] bg-[var(--panel2)] text-xs font-mono text-[var(--fg)] outline-none focus:border-[var(--banana)] focus:ring-2 focus:ring-[var(--banana)]/25 w-full sm:w-72 shadow-inner"
            />
          </div>
        </div>
      </main>

      <FormulaStrip title="The counting rule & survival criteria" eqs={[EQ.label, EQ.features]} />
      <FooterBar />
    </div>
  );
}
