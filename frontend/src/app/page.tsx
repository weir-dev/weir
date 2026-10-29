'use client';

import React from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { RiverHero } from '@/components/hero/RiverHero';
import { CountingFeed } from '@/components/crt/CountingFeed';
import { CountStrip } from '@/components/analytics/CountStrip';
import { LadderSection } from '@/components/analytics/LadderSection';
import { GaugePanel } from '@/components/analytics/GaugePanel';
import { FormulaStrip } from '@/components/math/FormulaStrip';
import { EQ } from '@/config/equations';
import { FooterBar } from '@/components/layout/FooterBar';
import { useEmileDatabase } from '@/hooks/useEmileDatabase';

export default function HomePage() {
  useEmileDatabase();

  return (
    <div className="wrap">
      <HeaderBar phaseText="phase 1 · learning" />
      <div className="hero-grid" id="window">
        <RiverHero />
        <CountingFeed />
      </div>
      <CountStrip />
      <LadderSection />
      <GaugePanel />
      <FormulaStrip title="What decides the gate" eqs={[EQ.floor, EQ.gates, EQ.level]} />
      <FooterBar />
    </div>
  );
}

