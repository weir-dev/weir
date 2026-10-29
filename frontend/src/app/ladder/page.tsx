'use client';

import React from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { FooterBar } from '@/components/layout/FooterBar';
import { LadderSection } from '@/components/analytics/LadderSection';
import { GaugePanel } from '@/components/analytics/GaugePanel';
import { FormulaStrip } from '@/components/math/FormulaStrip';
import { EQ } from '@/config/equations';
import { useEmileDatabase } from '@/hooks/useEmileDatabase';
import { useEmileStore } from '@/store/useEmileStore';

export default function TheLadderPage() {
  useEmileDatabase();
  const model = useEmileStore((state) => state.model);

  return (
    <div className="wrap min-h-screen flex flex-col">
      <HeaderBar phaseText="the ladder · model validation & weights" />

      <main className="w-full flex-1 p-4 md:p-8 space-y-8">
        <LadderSection />
        <GaugePanel />
      </main>

      <FormulaStrip title="Generalization theory & Four Locks" eqs={[EQ.vc, EQ.boot, EQ.floor, EQ.gates]} />
      <FooterBar />
    </div>
  );
}
