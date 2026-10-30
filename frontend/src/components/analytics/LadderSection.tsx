'use client';

import React from 'react';
import { useEmileStore } from '@/store/useEmileStore';

export const LadderSection: React.FC = () => {
  const model = useEmileStore((state) => state.model);
  const tally = useEmileStore((state) => state.tally);
  const isConnected = useEmileStore((state) => state.isConnected);
  const modelLoaded = useEmileStore((state) => state.modelLoaded);
  const gatesConfig = useEmileStore((state) => state.gatesConfig);

  const clearRate = tally.all > 0 ? ((tally.pass / tally.all) * 100).toFixed(1) : '0.0';
  const gateLevelPct = modelLoaded ? ((model.gate_level || 0) * 100).toFixed(1) : '—';
  const locks = model.locks || model.gates || {};

  const gConfig = gatesConfig || {
    n_samples_min: 2000,
    n_positive_min: 200,
    auc_std_max: 0.05,
    time_split_gap_max: 0.04,
  };

  const lockList = [
    {
      name: `Sample Volume (N ≥ ${gConfig.n_samples_min.toLocaleString('en-US')})`,
      val: `${(model.n || 0).toLocaleString('en-US')} / ${gConfig.n_samples_min.toLocaleString('en-US')}`,
      ok: !!(locks.lock_samples ?? locks.n_samples),
    },
    {
      name: `Cleared Target Class (N_pos ≥ ${gConfig.n_positive_min.toLocaleString('en-US')})`,
      val: `${(model.n_positive || 0).toLocaleString('en-US')} / ${gConfig.n_positive_min.toLocaleString('en-US')}`,
      ok: !!(locks.lock_cleared ?? locks.n_positive),
    },
    {
      name: `Variance Bound (σ_AUC < ${gConfig.auc_std_max})`,
      val: modelLoaded ? `σ = ${(model.auc_std || 0).toFixed(4)}` : '—',
      ok: !!(locks.lock_stability ?? locks.auc_std),
    },
    {
      name: `Out-of-Sample Time Split (gap ≤ ${gConfig.time_split_gap_max})`,
      val: (locks.lock_no_lookahead ?? locks.time_split) ? 'VERIFIED' : 'NOT YET',
      ok: !!(locks.lock_no_lookahead ?? locks.time_split),
    },
  ];

  const featureLabels: Record<string, string> = {
    holders_log: 'Holder Log Scale Distribution & Retention',
    hour_cos: '24-Hour Launch Cycle (Cos Signal)',
    hour_sin: '24-Hour Launch Cycle (Sin Signal)',
    dow_0: 'Monday Seasonal Inflow Pattern',
    dow_1: 'Tuesday Seasonal Inflow Pattern',
    dow_2: 'Wednesday Seasonal Inflow Pattern',
    dow_3: 'Thursday Seasonal Inflow Pattern',
    dow_4: 'Friday Seasonal Inflow Pattern',
    dow_5: 'Saturday Weekend Liquidity Wave',
    dow_6: 'Sunday Weekend Liquidity Wave',
    lore_len: 'Metadata Lore Word Count',
    name_tokens: 'Token Name Token Complexity',
  };

  const colors = [
    'linear-gradient(90deg, #10B981, #34D399)',
    'linear-gradient(90deg, #FC6423, #FBBF24)',
    'linear-gradient(90deg, #06B6D4, #38BDF8)',
    'linear-gradient(90deg, #8B5CF6, #C084FC)',
    'linear-gradient(90deg, #F43F5E, #FB7185)',
  ];
  const fi = model.feature_importance || {};
  const topFeatures = Object.entries(fi)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const sumWeights = topFeatures.reduce((acc, cur) => acc + cur[1], 0) || 1;

  return (
    <section className="lp" id="ladder">
      <div className="lp-head">
        <div>
          <span className="eyebrow-n flex items-center gap-2"><b className="bg-[var(--banana)] text-white">01</b>Continuous learning progress</span>
          <h2>Active model weights &amp; <em className="text-[var(--banana-hi)] font-bold">validation</em></h2>
          <p>
            Real-time aggregate data collected across Solana. Machine learning weights update continuously as token market caps cross established evaluation thresholds.
          </p>
        </div>
        {/* Right Side Telemetry Card to fill space */}
        <div className="rounded-xl border border-[var(--rule)] bg-[var(--panel2)]/90 backdrop-blur-md p-4 shadow-lg flex flex-col gap-3 min-w-[280px] sm:min-w-[340px] max-w-[420px] w-full md:w-auto">
          {/* Header row: Live Status pill + Engine title */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--soft)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--live)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--live)]"></span>
              </span>
              <span className="font-mono text-xs font-bold tracking-wider text-[var(--fg-hi)] uppercase">
                ML Validation Engine
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--live)]/15 text-[var(--live)] border border-[var(--live)]/30 font-bold">
              ONLINE
            </span>
          </div>

          {/* Metrics 2x2 grid */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
              <div className="text-[10px] uppercase text-[var(--dim)]">Cross-Validation</div>
              <div className="text-[var(--violet)] font-bold mt-0.5">5-Fold Stratified</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
              <div className="text-[10px] uppercase text-[var(--dim)]">Target Class</div>
              <div className="text-[var(--live)] font-bold mt-0.5">Peak MC ≥ $30K</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
              <div className="text-[10px] uppercase text-[var(--dim)]">VC Penalty (ε)</div>
              <div className="text-[var(--cyan)] font-bold mt-0.5">{modelLoaded ? (model.epsilon_vc || 0).toFixed(3) : 'Bound d=37'}</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--soft)]">
              <div className="text-[10px] uppercase text-[var(--dim)]">Launch Target</div>
              <div className="text-[var(--banana)] font-bold mt-0.5">AUC Floor ≥ 0.60</div>
            </div>
          </div>

          {/* Bottom Row: Phase tag + Water Level Progress */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--soft)]">
            <div className="tagbox a border-[var(--cyan)]/30 bg-[var(--cyan)]/10 text-[var(--cyan)] py-1 px-3 text-[11px] font-mono">
              <span className="k2">PHASE:</span>
              <b>1 · INGESTION</b>
            </div>
            <div className="tagbox b bg-[var(--live)]/15 border border-[var(--live)]/40 text-[var(--live)] py-1 px-3 text-[11px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] font-mono">
              GATE {gateLevelPct !== '—' ? `${gateLevelPct}%` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="g4">
        <div className="mc tex border-t-2 border-t-[var(--cyan)] hover:shadow-[0_0_16px_rgba(56,189,248,0.2)]">
          <div className="mc-top">
            <span className="mc-k text-[var(--cyan)]">Total Tokens Counted</span>
            <span className="mc-t bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30 font-bold">
              LIVE SCAN
            </span>
          </div>
          <div className="mc-v text-[var(--cyan)]">{tally.all.toLocaleString('en-US')}</div>
          <div className="mc-f">
            <span>Entry Threshold:</span>
            <b className="text-[var(--cyan)]">&gt; $10K Peak MC</b>
          </div>
        </div>

        <div className="mc tex border-t-2 border-t-[var(--live)] hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]">
          <div className="mc-top">
            <span className="mc-k text-[var(--live)]">Class Distribution</span>
            <span className="mc-t bg-[var(--live)]/15 text-[var(--live)] border border-[var(--live)]/30 font-bold">
              {clearRate}% Clear Rate
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' }}>
            <span className="mc-v" style={{ margin: 0, color: 'var(--live)' }}>{tally.pass.toLocaleString('en-US')}</span>
            <span className="mono" style={{ fontSize: '13px', color: 'var(--live)', opacity: 0.85 }}>cleared $30K</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--stall)', marginLeft: 'auto', fontWeight: 600 }}>
              {tally.stall.toLocaleString('en-US')} held
            </span>
          </div>
          <div className="minibar overflow-hidden rounded-full bg-[var(--stall)]/30 mt-2">
            <i style={{ display: 'block', height: '100%', width: `${clearRate}%`, background: 'var(--live)', boxShadow: '0 0 8px var(--live)', transition: 'width .5s' }} />
          </div>
        </div>

        <div className="mc tex border-t-2 border-t-[var(--violet)] hover:shadow-[0_0_16px_rgba(192,132,252,0.2)]">
          <div className="mc-top">
            <span className="mc-k text-[var(--violet)]">Model Accuracy &amp; Floor</span>
            <span className="mc-t bg-[var(--violet)]/15 text-[var(--violet)] border border-[var(--violet)]/30 font-bold">
              ROC-AUC
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span className="mc-v" style={{ margin: 0, color: 'var(--violet)' }}>
              {modelLoaded ? (model.auc || 0).toFixed(4) : '—'}
            </span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--dim)' }}>Measured</span>
          </div>
          <div className="mc-f">
            <span>Proven Floor (ε={modelLoaded ? (model.epsilon_vc || 0).toFixed(3) : '—'}):</span>
            <b style={{ color: 'var(--banana)', fontWeight: 700 }}>
              {modelLoaded ? (model.proven_floor || 0).toFixed(3) : '—'}
            </b>
          </div>
        </div>

        <div className="mc tex border-t-2 border-t-[var(--banana)] hover:shadow-[0_0_16px_rgba(252,100,35,0.2)]">
          <div className="mc-top">
            <span className="mc-k text-[var(--banana)]">Feature Dimension Vector</span>
            <span className="mc-t bg-[var(--banana)]/15 text-[var(--banana)] border border-[var(--banana)]/30 font-bold">
              d = {model.d || 37}
            </span>
          </div>
          <div className="mc-v" style={{ color: 'var(--banana)' }}>
            {model.d || 37}
            <span style={{ fontSize: '15px', letterSpacing: 0, fontWeight: 400, color: 'var(--dim)', marginLeft: '10px' }}>
              signal parameters
            </span>
          </div>
          <div className="mc-f">
            <span>Evaluation Window:</span>
            <b className="text-[var(--banana)]">Launch Hour 0 – 24 UTC</b>
          </div>
        </div>
      </div>

      {/* Grid of Details: Streams, Four Locks, Weights, Callout */}
      <div className="g12">
        <div className="col">
          <div className="box tex">
            <div className="box-h">
              <h3>
                <svg width="14" height="14" fill="none" stroke="var(--live)" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Active Data Streams &amp; Ingestion Pipeline
              </h3>
              <span
                className="mc-t"
                style={{
                  color: isConnected ? 'var(--live)' : 'var(--stall)',
                  background: isConnected ? 'color-mix(in srgb, var(--live) 10%, transparent)' : 'transparent',
                  border: isConnected ? '1px solid color-mix(in srgb, var(--live) 30%, transparent)' : '1px solid color-mix(in srgb, var(--stall) 40%, transparent)',
                }}
              >
                {isConnected ? 'STREAMING' : 'OFFLINE'}
              </span>
            </div>
            <p className="d">
              Continuous ingestion monitoring new Solana token mints, decentralized exchange pairs, and holder accounts.
            </p>
            <div id="streams">
              <div className="srow">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="dotwrap">
                    <i style={{ background: isConnected ? 'var(--live)' : 'var(--stall)' }} />
                    {isConnected && <i className="ping" style={{ background: 'var(--live)' }} />}
                  </span>
                  <div>
                    <div className="nm2">Entered the river (peak ≥ $10K)</div>
                    <div className="rt">Solana ingest worker</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--fg)', fontWeight: 700 }}>{tally.all.toLocaleString('en-US')}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: isConnected ? 'var(--live)' : 'var(--stall)' }}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </div>
                </div>
              </div>

              <div className="srow" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="dotwrap">
                    <i style={{ background: isConnected ? 'var(--live)' : 'var(--stall)' }} />
                  </span>
                  <div>
                    <div className="nm2">Cleared the falls (peak ≥ $30K)</div>
                    <div className="rt">Positive class</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--fg)', fontWeight: 700 }}>{tally.pass.toLocaleString('en-US')}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: isConnected ? 'var(--live)' : 'var(--stall)' }}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </div>
                </div>
              </div>

              <div className="srow" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="dotwrap">
                    <i style={{ background: isConnected ? 'var(--live)' : 'var(--stall)' }} />
                  </span>
                  <div>
                    <div className="nm2">Held below (age ≥ 48h)</div>
                    <div className="rt">Negative class</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--fg)', fontWeight: 700 }}>{tally.stall.toLocaleString('en-US')}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: isConnected ? 'var(--live)' : 'var(--stall)' }}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Four Locks */}
          <div className="box tex">
            <h3 style={{ fontFamily: 'var(--mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--fg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="14" height="14" fill="none" stroke="var(--banana)" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Model Validation &amp; Four Locks Status
            </h3>
            <div className="gates flex flex-col gap-2">
              {lockList.map((lock, i) => (
                <div key={i} className={`gate p-2.5 rounded-lg border transition-all ${lock.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-orange-500/25 bg-orange-500/5'}`}>
                  <div className="gl font-medium text-xs flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${lock.ok ? 'bg-[var(--live)]' : 'bg-[var(--banana)]'}`} />
                    Lock {i + 1} · {lock.name}
                  </div>
                  <div className="gf flex items-center justify-between mt-1">
                    <span className="gv font-mono font-semibold text-xs" style={{ color: lock.ok ? 'var(--live)' : 'var(--banana)' }}>{lock.val}</span>
                    <span className={`gpill ${lock.ok ? 'ok' : 'wip pulse'}`}>
                      {lock.ok ? '✓ OPEN' : '● HOLDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Importance + Callout */}
        <div className="box tex" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="box-h" style={{ marginBottom: '8px' }}>
              <h3>
                <svg width="14" height="14" fill="none" stroke="var(--violet)" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
                </svg>
                Learned Pattern Weights (Feature Importance)
              </h3>
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--violet)', fontWeight: 600 }}>
                {model.d || 37} FEATURES TRACKED
              </span>
            </div>
            <p className="d" style={{ marginBottom: '20px' }}>
              The relative impact of extracted data signals calculated by WEIR&#39;s training algorithm to distinguish tokens that cleared $30K from those held below.
            </p>

            {topFeatures.length === 0 ? (
              <div className="fw">
                <div className="skel" aria-hidden="true">
                  <div style={{ width: '86%' }} />
                  <div style={{ width: '64%' }} />
                  <div style={{ width: '48%' }} />
                  <div style={{ width: '32%' }} />
                  <div style={{ width: '20%' }} />
                </div>
                <p className="skel-note">No model run yet. Feature weights appear after the first training run.</p>
              </div>
            ) : (
              <div className="fw">
                {topFeatures.map(([code, v], i) => {
                  const pct = ((v / sumWeights) * 100).toFixed(1);
                  return (
                    <div key={code} className="fw-row">
                      <div className="t">
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="rk">#{i + 1}</span>
                          <span style={{ color: 'var(--fg)', fontWeight: 500 }}>
                            {featureLabels[code] || `Signal ${code.toUpperCase()}`}
                          </span>
                        </span>
                        <b style={{ color: 'var(--fg)' }}>{pct}%</b>
                      </div>
                      <div className="bar">
                        <i style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="callout">
            <div>
              <div className="ck">Gate Water Level</div>
              <div className="cd">
                Proven floor <b id="cFloor">{modelLoaded ? (model.proven_floor || 0).toFixed(4) : '—'}</b> vs Target <b className="t">0.600</b>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <div className="cv">
                {gateLevelPct !== '—' ? `${gateLevelPct}%` : '—'}
              </div>
              <div className="cs">
                {!modelLoaded 
                  ? 'NO MODEL RUN' 
                  : (model.held_by_lock || model.blocked_by)
                    ? `HELD BY ${String(model.held_by_lock || model.blocked_by).toUpperCase()}`
                    : 'ALL LOCKS OPEN'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
