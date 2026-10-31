'use client';

import React, { useEffect, useState } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { FooterBar } from '@/components/layout/FooterBar';
import { FormulaStrip } from '@/components/math/FormulaStrip';
import { EQ } from '@/config/equations';
import { getApiBaseUrl } from '@/config/constants';
import { useEmileDatabase } from '@/hooks/useEmileDatabase';
import { useEmileStore } from '@/store/useEmileStore';

interface ModelRunHistoryItem {
  id: number;
  ran_at: string;
  n_samples: number;
  n_positive: number;
  auc_mean: number;
  proven_floor: number;
  gate_level?: number;
  jar_level?: number;
  held_by_lock?: string | null;
  blocked_by?: string | null;
}

export default function ModelRunsPage() {
  useEmileDatabase();
  const latestModel = useEmileStore((state) => state.model);
  const [runs, setRuns] = useState<ModelRunHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/model/history?days=30`);
        if (res.ok) {
          const data = await res.json();
          setRuns(data || []);
        }
      } catch (e) {
        console.warn('Failed to load model history:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRuns();
  }, []);

  return (
    <div className="wrap min-h-screen flex flex-col">
      <HeaderBar phaseText="runs · hourly model validation history" />

      <main className="w-full flex-1 p-4 md:p-8 space-y-8">
        <div className="lp-head">
          <div>
            <span className="eyebrow-n flex items-center gap-2"><b className="bg-[var(--banana)] text-white">04</b>Hourly Model Training</span>
            <h2>Model <em className="text-[var(--banana-hi)] font-bold">Runs</em> &amp; Convergence</h2>
            <p>
              LightGBM models train on the labeled Solana universe every hour. The proven floor and Four Locks are evaluated across 5-fold stratified cross-validation.
            </p>
          </div>
          {/* Right Side 3D Fish Mascot Card (Kip the Salmon #0342) */}
          <div className="relative group overflow-hidden rounded-2xl border border-purple-500/25 shadow-2xl bg-gradient-to-br from-[#191522] via-[#120E19] to-[#0D0A12] min-w-[300px] sm:min-w-[360px] max-w-[430px] w-full md:w-auto h-[185px] sm:h-[195px] flex items-center justify-between p-4 flex-shrink-0">
            {/* Subtle Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                backgroundSize: '14px 14px'
              }}
            />

            {/* Ambient Glow behind Kip */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-orange-500/15 blur-xl pointer-events-none" />

            {/* Left Info Column */}
            <div className="relative z-10 flex flex-col justify-between h-full py-0.5 max-w-[185px] sm:max-w-[210px]">
              {/* Top row: Status */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-purple-400 uppercase">
                    HOURLY CYCLE · LIGHTGBM
                  </span>
                </div>
                <h3 className="font-sans font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                  Training Cadence
                </h3>
              </div>

              {/* Middle metrics */}
              <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                <span className="text-zinc-300 font-medium">Floor: {latestModel.proven_floor ? latestModel.proven_floor.toFixed(3) : '0.500'} / 0.600</span>
                <span className="text-purple-300 font-semibold text-[10.5px]">CV AUC: {latestModel.auc ? latestModel.auc.toFixed(4) : '0.5480'}</span>
              </div>

              {/* Bottom: Agent tag + Target Pill */}
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                  AGENT #0342
                </span>
                <span className="font-mono text-[10.5px] px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-purple-300 border border-white/10 font-bold shadow-md">
                  TARGET: 0.600
                </span>
              </div>
            </div>

            {/* Right: Kip the Salmon 3D Model (Exact user image) */}
            <div className="relative z-10 h-full flex items-center justify-end flex-shrink-0 pl-2">
              <img
                src="/brand/kip-front-left.png"
                alt="Kip the Salmon (WEIR Agent #0342)"
                className="h-[148px] sm:h-[165px] w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] transition-all duration-500 ease-out group-hover:scale-108 group-hover:-translate-y-1"
              />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="box tex">
          <div className="box-h" style={{ marginBottom: '16px' }}>
            <h3>Recent Model Runs (Last 30 Days)</h3>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--dim)' }}>
              Target: Proven Floor ≥ 0.600
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center font-mono text-sm text-[var(--dim)]">
              Loading model run history…
            </div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center font-mono text-sm text-[var(--dim)]">
              No historical runs recorded yet. Model runs will populate here once training cycles execute.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[var(--soft)] text-[var(--faint)] uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Run</th>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Samples (N)</th>
                    <th className="py-3 px-4">Cleared (N_pos)</th>
                    <th className="py-3 px-4">Measured AUC</th>
                    <th className="py-3 px-4">Proven Floor</th>
                    <th className="py-3 px-4">Water Level</th>
                    <th className="py-3 px-4 text-right">Lock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--soft)]">
                  {runs.map((r) => {
                    const level = (r.gate_level ?? r.jar_level ?? 0) * 100;
                    const lockHolding = r.held_by_lock ?? r.blocked_by;
                    return (
                      <tr key={r.id} className="hover:bg-[var(--soft)] transition-colors">
                        <td className="py-3 px-4 font-bold text-[var(--fg)]">#{r.id}</td>
                        <td className="py-3 px-4 text-[var(--dim)]">
                          {new Date(r.ran_at).toISOString().replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="py-3 px-4">{r.n_samples.toLocaleString('en-US')}</td>
                        <td className="py-3 px-4 text-[var(--live)]">{r.n_positive.toLocaleString('en-US')}</td>
                        <td className="py-3 px-4 text-[var(--cyan)] font-semibold">{r.auc_mean.toFixed(4)}</td>
                        <td className="py-3 px-4 text-[var(--banana)] font-bold">{r.proven_floor.toFixed(3)}</td>
                        <td className="py-3 px-4 font-bold">{level.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`gpill ${!lockHolding ? 'ok' : 'wip'}`}
                          >
                            {!lockHolding ? 'ALL OPEN' : `HELD: ${lockHolding}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <FormulaStrip title="Convergence bounds across hourly training runs" eqs={[EQ.auc, EQ.boot, EQ.floor]} />
      <FooterBar />
    </div>
  );
}
