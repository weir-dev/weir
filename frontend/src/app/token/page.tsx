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
          {/* Right Side 3D Fish Mascot Card (Kip the Salmon #0342) */}
          <div className="relative group overflow-hidden rounded-2xl border border-amber-500/25 shadow-2xl bg-gradient-to-br from-[#1E1911] via-[#15120D] to-[#0E0C09] min-w-[300px] sm:min-w-[360px] max-w-[430px] w-full md:w-auto h-[185px] sm:h-[195px] flex items-center justify-between p-4 flex-shrink-0">
            {/* Subtle Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                backgroundSize: '14px 14px'
              }}
            />

            {/* Ambient Glow behind Kip */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-orange-500/15 blur-xl pointer-events-none" />

            {/* Left Info Column */}
            <div className="relative z-10 flex flex-col justify-between h-full py-0.5 max-w-[185px] sm:max-w-[210px]">
              {/* Top row: Status */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUnlocked ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isUnlocked ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  </span>
                  <span className={`font-mono text-[10px] font-bold tracking-widest uppercase ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isUnlocked ? 'GATE OPEN' : 'STRICT BARRIER'}
                  </span>
                </div>
                <h3 className="font-sans font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                  Launch Gate Barrier
                </h3>
              </div>

              {/* Middle metrics */}
              <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                <span className="text-zinc-300 font-medium">Solana SPL Token</span>
                <span className="text-amber-300 font-semibold text-[10.5px]">Four Hard Locks Active</span>
              </div>

              {/* Bottom: Agent tag + Water Level Pill */}
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                  AGENT #0342
                </span>
                <span className={`font-mono text-[10.5px] px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'} border border-white/10 font-bold shadow-md`}>
                  WATER: {gateLevelPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Right: Kip the Salmon 3D Model (Exact user image) */}
            <div className="relative z-10 h-full flex items-center justify-end flex-shrink-0 pl-2">
              <img
                src="/brand/kip-front.png"
                alt="Kip the Salmon (WEIR Agent #0342)"
                className="h-[148px] sm:h-[165px] w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] transition-all duration-500 ease-out group-hover:scale-108 group-hover:-translate-y-1"
              />
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
