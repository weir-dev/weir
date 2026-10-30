'use client';

import React, { useState } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { FooterBar } from '@/components/layout/FooterBar';
import { WaterGauge3D } from '@/components/gauge/WaterGauge3D';
import { WEIR_CONTRACT_ADDRESS } from '@/config/constants';
import { useEmileDatabase } from '@/hooks/useEmileDatabase';
import { useEmileStore } from '@/store/useEmileStore';

export default function WeirTokenPage() {
  useEmileDatabase();
  const model = useEmileStore((state) => state.model);
  const [copied, setCopied] = useState(false);

  const ca = WEIR_CONTRACT_ADDRESS || '';
  const gateLevelPct = ((model.gate_level || 0) * 100);
  const isUnlocked = gateLevelPct >= 100 && !model.held_by_lock;

  const handleCopy = async () => {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="wrap min-h-screen flex flex-col">
      <HeaderBar phaseText="$WEIR · mathematical launch gate" />

      <main className="w-full flex-1 p-4 md:p-8 space-y-8">
        <div className="lp-head">
          <div>
            <span className="eyebrow-n"><b>05</b>Solana SPL Token</span>
            <h2>$WEIR Token <em>Launch Gate</em></h2>
            <p>
              $WEIR does not launch on a schedule. The river gate only opens when the proven floor clears ROC-AUC 0.60 and all Four Locks are verified.
            </p>
          </div>
          {/* Right Side Telemetry Card to fill space */}
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--panel2)]/90 backdrop-blur-md p-4 shadow-lg flex flex-col gap-3 min-w-[280px] sm:min-w-[340px] max-w-[420px] w-full md:w-auto">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--soft)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUnlocked ? 'bg-[var(--live)]' : 'bg-[var(--banana)]'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isUnlocked ? 'bg-[var(--live)]' : 'bg-[var(--banana)]'}`}></span>
                </span>
                <span className="font-mono text-xs font-bold tracking-wider text-[var(--fg-hi)] uppercase">
                  Launch Gate Barrier
                </span>
              </div>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${isUnlocked ? 'bg-[var(--live)]/15 text-[var(--live)] border-[var(--live)]/30' : 'bg-[var(--banana)]/15 text-[var(--banana)] border-[var(--banana)]/30'} border font-bold`}>
                {isUnlocked ? 'GATE OPEN' : 'STRICT BARRIER'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Proven Floor</div>
                <div className="text-[var(--banana)] font-bold mt-0.5">
                  {(model.proven_floor || 0.5).toFixed(3)} / 0.600
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Four Locks</div>
                <div className="text-[var(--live)] font-bold mt-0.5">4 Hard Gates</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Network</div>
                <div className="text-[var(--violet)] font-bold mt-0.5">Solana SPL</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
                <div className="text-[10px] uppercase text-[var(--dim)]">Launch Model</div>
                <div className="text-[var(--cyan)] font-bold mt-0.5">100% Fair Proof</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--soft)]">
              <div className="tagbox a border-[var(--banana)]/30 bg-[var(--banana)]/10 text-[var(--banana)] py-1 px-3 text-[11px] font-mono">
                <span className="k2">STATUS:</span>
                <b>{isUnlocked ? 'GATE OPEN' : 'LOCKED BY PROOF'}</b>
              </div>
              <div className="tagbox b bg-[var(--live)]/15 border border-[var(--live)]/40 text-[var(--live)] py-1 px-3 text-[11px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] font-mono">
                WATER LEVEL: {gateLevelPct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* 3D Gauge */}
          <div className="box tex flex flex-col items-center justify-center p-8">
            <div className="gauge-wrap has3d" style={{ width: '220px', height: '300px' }}>
              <WaterGauge3D levelPct={gateLevelPct} />
            </div>
            <div className="mt-4 text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--faint)]">
                Water Level at the Gate
              </div>
              <div className="font-sans font-bold text-4xl text-[var(--banana)] mt-1">
                {gateLevelPct.toFixed(1)}%
              </div>
              <div className="text-xs font-mono text-[var(--dim)] mt-2">
                Proven floor: <b>{(model.proven_floor || 0.5).toFixed(3)}</b> / 0.600
              </div>
            </div>
          </div>

          {/* Contract Address & Tokenomics */}
          <div className="space-y-6">
            <div className="box tex p-6 space-y-4">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--fg-hi)] font-bold">
                Solana Contract Address (CA)
              </h3>
              <p className="text-xs text-[var(--dim)] leading-relaxed">
                {isUnlocked
                  ? 'The gate has opened! The verified token mint address is below:'
                  : 'Token mint is held locked until gate criteria are met. The address placeholder will be replaced automatically upon verified launch:'}
              </p>

              <div className="p-4 rounded-xl bg-[var(--panel2)] border border-[var(--rule)] flex items-center justify-between gap-4 font-mono text-xs">
                <span className="font-bold text-[var(--banana)] break-all">
                  {ca || '[ADDED AT LAUNCH]'}
                </span>
                {ca && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn btn-live whitespace-nowrap"
                  >
                    {copied ? 'COPIED' : 'COPY CA'}
                  </button>
                )}
              </div>
            </div>

            <div className="box tex p-6 space-y-3">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--fg-hi)] font-bold">
                Lock Status
              </h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--soft)]">
                  <span className="text-[var(--dim)]">Lock 1 (Sample size n ≥ 2,000):</span>
                  <span className={model.locks?.lock_samples ? 'text-[var(--live)] font-bold' : 'text-[var(--stall)]'}>
                    {model.locks?.lock_samples ? 'OPEN' : 'HOLDING'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--soft)]">
                  <span className="text-[var(--dim)]">Lock 2 (Cleared count ≥ 200):</span>
                  <span className={model.locks?.lock_cleared ? 'text-[var(--live)] font-bold' : 'text-[var(--stall)]'}>
                    {model.locks?.lock_cleared ? 'OPEN' : 'HOLDING'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--soft)]">
                  <span className="text-[var(--dim)]">Lock 3 (Fold stability σ &lt; 0.05):</span>
                  <span className={model.locks?.lock_stability ? 'text-[var(--live)] font-bold' : 'text-[var(--stall)]'}>
                    {model.locks?.lock_stability ? 'OPEN' : 'HOLDING'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--soft)]">
                  <span className="text-[var(--dim)]">Lock 4 (No lookahead gap ≤ 0.04):</span>
                  <span className={model.locks?.lock_no_lookahead ? 'text-[var(--live)] font-bold' : 'text-[var(--stall)]'}>
                    {model.locks?.lock_no_lookahead ? 'OPEN' : 'HOLDING'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--soft)] bg-[var(--panel)] text-[11px] text-[var(--faint)] leading-relaxed">
              <b>Mandatory Disclaimer:</b> WEIR counts survival, not price. It is a research tool, not financial advice. No token will ever be launched or announced before the proven statistical floor clears 0.60.
            </div>
          </div>
        </div>
      </main>

      <FooterBar />
    </div>
  );
}
