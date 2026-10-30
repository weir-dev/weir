'use client';

import React from 'react';
import { useEmileStore } from '@/store/useEmileStore';

export const CountStrip: React.FC = () => {
  const tally = useEmileStore((state) => state.tally);
  const holdersList = useEmileStore((state) => state.holdersList);

  const sortedHolders = [...holdersList].sort((a, b) => a - b);
  const medianHolders = sortedHolders.length ? sortedHolders[sortedHolders.length >> 1] : null;

  return (
    <>
      <div className="wave-rule top-wave" aria-hidden="true" />
      <div className="band stats-grid">
        <div className="st">
          <div className="st-k">entered the river</div>
          <div className="st-v" id="tAll">
            {tally.all.toLocaleString('en-US')}
          </div>
          <div className="st-d">Peak market cap above $10K</div>
        </div>

        <div className="st">
          <div className="st-k">cleared the falls</div>
          <div className="st-v" id="tPass" style={{ color: 'var(--live)' }}>
            {tally.pass.toLocaleString('en-US')}
          </div>
          <div className="st-d">Reached $30K</div>
        </div>

        <div className="st">
          <div className="st-k">held below</div>
          <div className="st-v" id="tStall">
            {tally.stall.toLocaleString('en-US')}
          </div>
          <div className="st-d">Below $30K after 48 hours</div>
        </div>

        <div className="st">
          <div className="st-k">median holders</div>
          <div className="st-v" id="tMed">
            {medianHolders != null ? medianHolders.toLocaleString('en-US') : '—'}
          </div>
          <div className="st-d">Sampled once at 48 hours</div>
        </div>
      </div>
    </>
  );
};

