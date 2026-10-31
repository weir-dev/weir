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
          {/* Right Side 3D Fish Themed Card */}
          <div className="relative group overflow-hidden rounded-2xl border border-[var(--rule)] shadow-xl bg-[var(--panel2)] min-w-[280px] sm:min-w-[340px] max-w-[420px] w-full md:w-auto h-[180px] sm:h-[195px] flex items-center justify-center flex-shrink-0">
            <img
              src="/brand/kip-counting-3d.jpg"
              alt="Kip the Salmon Counting Window Observation Deck"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 pointer-events-none" />

            {/* Floating Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[var(--cyan)] border border-[var(--cyan)]/40 flex items-center gap-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--cyan)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--cyan)]"></span>
                </span>
                SOLANA DEX STREAM
              </span>
              <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-[var(--cyan)]/20 backdrop-blur-md text-[var(--cyan)] border border-[var(--cyan)]/40 font-bold uppercase tracking-wider">
                POLLING 60s
              </span>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="text-[11px] font-mono text-white/90 font-medium drop-shadow-md">
                Fish Ladder Observation Deck
              </span>
              <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[var(--live)] border border-white/10 font-bold shadow-md">
                COUNTING: {tally.all.toLocaleString('en-US')}
              </span>
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
