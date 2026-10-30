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
          {/* Right Side Telemetry Card to fill space */}
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--panel2)]/90 backdrop-blur-md p-4 shadow-lg flex flex-col gap-3 min-w-[280px] sm:min-w-[340px] max-w-[420px] w-full md:w-auto">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--soft)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--cyan)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--cyan)]"></span>
                </span>
                <span className="font-mono text-xs font-bold tracking-wider text-[var(--fg-hi)] uppercase">
                  Solana DEX Stream
                </span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30 font-bold">
                POLLING 60s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Entry Threshold</div>
                <div className="text-[var(--cyan)] font-bold mt-0.5">≥ $10K Peak MC</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Clear Target</div>
                <div className="text-[var(--live)] font-bold mt-0.5">≥ $30K Peak MC</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Label Window</div>
                <div className="text-[var(--stall)] font-bold mt-0.5">48 Hours Stalled</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Holders Sampler</div>
                <div className="text-[var(--violet)] font-bold mt-0.5">Helius DAS 48h</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--soft)]">
              <div className="tagbox a border-[var(--cyan)]/30 bg-[var(--cyan)]/10 text-[var(--cyan)] py-1 px-3 text-[11px] font-mono">
                <span className="k2">CHAIN:</span>
                <b>SOLANA MAINNET</b>
              </div>
              <div className="tagbox b bg-[var(--live)]/15 border border-[var(--live)]/40 text-[var(--live)] py-1 px-3 text-[11px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] font-mono">
                COUNTING: {tally.all.toLocaleString('en-US')}
              </div>
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
