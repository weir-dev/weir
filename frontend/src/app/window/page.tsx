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
          <div className="lp-tags">
            <div className="tagbox a">
              <span className="k2">CHAIN:</span>
              <b>SOLANA MAINNET</b>
            </div>
            <div className="tagbox b">
              COUNTING: {tally.all.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <CountStrip />

        {/* Live Terminal & Feed */}
        <div className="grid grid-cols-1 gap-6">
          <CountingFeed />
        </div>

        {/* Filter & Search Bar */}
        <div className="box tex" style={{ marginTop: '24px' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className={`btn ${filter === 'all' ? 'btn-live' : 'btn-ghost'}`}
                onClick={() => setFilter('all')}
              >
                All Tokens ({tokens.length})
              </button>
              <button
                type="button"
                className={`btn ${filter === 'pending' ? 'btn-live' : 'btn-ghost'}`}
                onClick={() => setFilter('pending')}
              >
                In River / Open ({tokens.filter((t) => t.status === 'pending').length})
              </button>
              <button
                type="button"
                className={`btn ${filter === 'passed' ? 'btn-live' : 'btn-ghost'}`}
                onClick={() => setFilter('passed')}
              >
                Cleared $30K ({tokens.filter((t) => t.status === 'passed').length})
              </button>
              <button
                type="button"
                className={`btn ${filter === 'stalled' ? 'btn-live' : 'btn-ghost'}`}
                onClick={() => setFilter('stalled')}
              >
                Held Below ({tokens.filter((t) => t.status === 'stalled').length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by name, symbol, or mint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 px-3 rounded-lg border border-[var(--rule)] bg-[var(--panel2)] text-xs font-mono text-[var(--fg)] outline-none focus:border-[var(--banana)] w-full sm:w-64"
            />
          </div>
        </div>
      </main>

      <FormulaStrip title="The counting rule & survival criteria" eqs={[EQ.label, EQ.features]} />
      <FooterBar />
    </div>
  );
}
