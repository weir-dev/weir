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
          {/* Right Side 3D Fish Themed Card */}
          <div className="relative group overflow-hidden rounded-2xl border border-[var(--rule)] shadow-xl bg-[var(--panel2)] min-w-[280px] sm:min-w-[340px] max-w-[420px] w-full md:w-auto h-[180px] sm:h-[195px] flex items-center justify-center flex-shrink-0">
            <img
              src="/brand/kip-runs-3d.jpg"
              alt="Kip the Salmon Model Runs & Hydro-Clockwork Convergence"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 pointer-events-none" />

            {/* Floating Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[var(--violet)] border border-[var(--violet)]/40 flex items-center gap-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--violet)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--violet)]"></span>
                </span>
                TRAINING CADENCE
              </span>
              <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-[var(--violet)]/20 backdrop-blur-md text-[var(--violet)] border border-[var(--violet)]/40 font-bold uppercase tracking-wider">
                HOURLY CYCLE
              </span>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="text-[11px] font-mono text-white/90 font-medium drop-shadow-md">
                Hydro-Clockwork Convergence
              </span>
              <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[var(--banana-hi)] border border-white/10 font-bold shadow-md">
                TARGET: 0.600
              </span>
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
