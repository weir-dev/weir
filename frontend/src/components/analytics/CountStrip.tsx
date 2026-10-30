'use client';

import React from 'react';
import { useEmileStore } from '@/store/useEmileStore';

export const CountStrip: React.FC = () => {
  const tally = useEmileStore((state) => state.tally);
  const model = useEmileStore((state) => state.model);
  const holdersList = useEmileStore((state) => state.holdersList);

  const medianHolders = holdersList.length ? holdersList[holdersList.length >> 1] : null;

  return (
    <div className="stats-grid band shadow-lg">
      <div className="st">
        <div className="st-k flex items-center gap-1.5 text-[var(--cyan)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
          Entered The River
        </div>
        <div className="st-v" style={{ color: 'var(--cyan)' }}>
          {tally.all.toLocaleString('en-US')}
        </div>
        <div className="st-d font-mono text-xs opacity-75">Solana tokens peak MC ≥ $10K</div>
      </div>

      <div className="st">
        <div className="st-k flex items-center gap-1.5 text-[var(--live)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] animate-pulse" />
          Cleared The Falls
        </div>
        <div className="st-v" style={{ color: 'var(--live)' }}>
          {tally.pass.toLocaleString('en-US')}
        </div>
        <div className="st-d font-mono text-xs opacity-75">Positive class (reached ≥ $30K)</div>
      </div>

      <div className="st">
        <div className="st-k flex items-center gap-1.5 text-[var(--stall)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--stall)]" />
          Held Below
        </div>
        <div className="st-v" style={{ color: 'var(--stall)' }}>
          {tally.stall.toLocaleString('en-US')}
        </div>
        <div className="st-d font-mono text-xs opacity-75">Negative class (mandek after 48h)</div>
      </div>

      <div className="st">
        <div className="st-k flex items-center gap-1.5 text-[var(--violet)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)]" />
          Hourly Model Runs
        </div>
        <div className="st-v" style={{ color: 'var(--violet)' }}>
          {model.run_id ? `#${model.run_id}` : (medianHolders ? medianHolders.toLocaleString('en-US') : '—')}
        </div>
        <div className="st-d font-mono text-xs opacity-75">
          {model.run_id ? 'Stratified 5-fold CV' : 'Median 48h holders'}
        </div>
      </div>
    </div>
  );
};
