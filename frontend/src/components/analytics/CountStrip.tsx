'use client';

import React from 'react';
import { useEmileStore } from '@/store/useEmileStore';

export const CountStrip: React.FC = () => {
  const tally = useEmileStore((state) => state.tally);
  const model = useEmileStore((state) => state.model);
  const holdersList = useEmileStore((state) => state.holdersList);

  const medianHolders = holdersList.length ? holdersList[holdersList.length >> 1] : null;

  return (
    <div className="stats-grid band">
      <div className="st">
        <div className="st-k">Entered The River</div>
        <div className="st-v">{tally.all.toLocaleString('en-US')}</div>
        <div className="st-d">Solana tokens peak MC ≥ $10K</div>
      </div>

      <div className="st">
        <div className="st-k">Cleared The Falls</div>
        <div className="st-v" style={{ color: 'var(--live)' }}>{tally.pass.toLocaleString('en-US')}</div>
        <div className="st-d">Positive class (reached ≥ $30K)</div>
      </div>

      <div className="st">
        <div className="st-k">Held Below</div>
        <div className="st-v" style={{ color: 'var(--stall)' }}>{tally.stall.toLocaleString('en-US')}</div>
        <div className="st-d">Negative class (mandek after 48h)</div>
      </div>

      <div className="st">
        <div className="st-k">Hourly Model Runs</div>
        <div className="st-v" style={{ color: 'var(--banana)' }}>
          {model.run_id ? `#${model.run_id}` : (medianHolders ? medianHolders.toLocaleString('en-US') : '—')}
        </div>
        <div className="st-d">
          {model.run_id ? 'Stratified 5-fold CV' : 'Median 48h holders'}
        </div>
      </div>
    </div>
  );
};
