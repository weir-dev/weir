'use client';

import React, { useState, useEffect } from 'react';
import { useEmileStore } from '@/store/useEmileStore';
import { WaterGauge3D } from '@/components/gauge/WaterGauge3D';
import katex from 'katex';

const DELTA = 0.05;
const TARGET = 0.60;
const FLOOR = 0.50;

const epsCalc = (n: number, d: number) =>
  n <= d || n <= 0 ? 1.0 : Math.sqrt((d * (Math.log((2 * n) / d) + 1) + Math.log(4 / DELTA)) / n);

const floorCalc = (a: number, n: number, d: number) => Math.max(FLOOR, a - epsCalc(n, d));

export const GaugePanel: React.FC = () => {
  const model = useEmileStore((state) => state.model);
  const modelLoaded = useEmileStore((state) => state.modelLoaded);

  const [simN, setSimN] = useState<number>(340);
  const [simAuc, setSimAuc] = useState<number>(0.548);
  const [simD, setSimD] = useState<number>(37);
  const [touched, setTouched] = useState<boolean>(false);

  useEffect(() => {
    if (modelLoaded && !touched && model.n > 0) {
      setSimN(model.n);
      setSimAuc(model.auc || 0.548);
      setSimD(model.d || 37);
    }
  }, [modelLoaded, model.n, model.auc, model.d, touched]);

  const currentEps = epsCalc(simN, simD);
  const currentFloor = floorCalc(simAuc, simN, simD);
  const calculatedGateLevel = Math.max(0, Math.min(100, ((currentFloor - FLOOR) / (TARGET - FLOOR)) * 100));

  const liveGateLevel = model.gate_level ? model.gate_level * 100 : calculatedGateLevel;
  const displayLevel = touched ? calculatedGateLevel : liveGateLevel;
  const isReady = displayLevel >= 100;

  const epsTex = currentEps >= 1 ? '1.000' : currentEps.toFixed(3);
  const rawSubEps = (simAuc - Math.min(1, currentEps)).toFixed(3);

  const formula1Html = katex.renderToString(
    `\\varepsilon = \\sqrt{\\frac{${simD}\\left(\\ln\\frac{2\\cdot ${simN}}{${simD}}+1\\right)+\\ln 80}{${simN}}} = \\mathbf{${epsTex}}`,
    { displayMode: true, throwOnError: false }
  );

  const formula2Html = katex.renderToString(
    `\\overline{\\mathrm{AUC}} - \\varepsilon = ${simAuc.toFixed(3)} - ${epsTex} = ${rawSubEps}`,
    { displayMode: true, throwOnError: false }
  );

  return (
    <div className="proof tex-diagonal" id="gate">
      <div className="proof-h">
        <span style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span className="eyebrow-n"><b>02</b>Vapnik–Chervonenkis proof &amp; capacity</span>
          <span className="t">The gate opens on <em>proof</em>, not on time.</span>
        </span>
        <span className={`s ${isReady ? 'ready' : ''}`}>
          {isReady ? 'TARGET AUC 0.60 REACHED (100%)' : `WATER LEVEL: ${displayLevel.toFixed(1)}%`}
        </span>
      </div>

      <div className="proof-grid">
        {/* Left Column: 3D Gauge */}
        <div className="pg-l">
          <span className="br tl" />
          <span className="br tr" />
          <span className="br bl" />
          <span className="br brr" />

          <div className="pg-kick">
            <i className="lamp-active" style={{ background: isReady ? 'var(--live)' : 'var(--banana-hi)' }} />
            WEIR Water Gauge
          </div>

          <div className="gauge-wrap has3d" style={{ position: 'relative' }}>
            <WaterGauge3D levelPct={displayLevel} />
            <span className="g3d-hint">Drag to turn</span>
          </div>

          <div style={{ marginTop: '4px', textAlign: 'center' }}>
            <div className="lvl-k">Water Level</div>
            <div className="lvl-v" style={{ color: isReady ? 'var(--live)' : 'var(--banana)' }}>
              {displayLevel.toFixed(1)}<small>%</small>
            </div>
          </div>

          <div className="mini2">
            <div>
              <div className="k3">Proven Floor</div>
              <div className="v3" style={{ color: 'var(--banana)' }}>{currentFloor.toFixed(3)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="k3">Target</div>
              <div className="v3" style={{ color: 'var(--live)' }}>0.600</div>
            </div>
          </div>
        </div>

        {/* Middle Column: Math Explanation */}
        <div className="pg-m band tex-paper">
          <div>
            <div className="ttl">Why the water rises <em>slowly</em></div>
            <p className="pp">
              A model can look good by luck on a small sample. Vapnik–Chervonenkis theory puts a number on that luck: with <b>n</b> tokens and a model of capacity <b>d</b>, the true score can sit below the measured one by at most ε, with 95% confidence.
            </p>
            <div className="formula math-formula">
              <div dangerouslySetInnerHTML={{ __html: formula1Html }} />
              <div className="dash" dangerouslySetInnerHTML={{ __html: formula2Html }} />
            </div>
          </div>
          <p className="pp" style={{ fontSize: '11.5px' }}>
            WEIR lets water rise with <b>AUC − ε</b>, never with the raw score. Good model, thin sample: the water stays low. That is the point.
          </p>
        </div>

        {/* Right Column: Interactive Parameter Sliders */}
        <div className="pg-r">
          <div className="ros">
            <div className="ro">
              <div className="ro-k">measured AUC</div>
              <div className="ro-v" style={{ color: 'var(--live)' }}>{simAuc.toFixed(3)}</div>
            </div>
            <div className="ro">
              <div className="ro-k">penalty ε</div>
              <div className="ro-v" style={{ color: 'var(--violet)' }}>
                {currentEps >= 1 ? '-' : currentEps.toFixed(3)}
              </div>
            </div>
            <div className="ro">
              <div className="ro-k">proven floor</div>
              <div className="ro-v" style={{ color: 'var(--banana)' }}>{currentFloor.toFixed(3)}</div>
            </div>
          </div>

          <div className="ctrl">
            <div className="sr">
              <label htmlFor="simN">tokens sampled</label>
              <input
                id="simN"
                type="range"
                min="120"
                max="24000"
                step="20"
                value={simN}
                onChange={(e) => {
                  setTouched(true);
                  setSimN(Number(e.target.value));
                }}
              />
              <output htmlFor="simN">{simN.toLocaleString('en-US')}</output>
            </div>

            <div className="sr">
              <label htmlFor="simAuc">measured AUC</label>
              <input
                id="simAuc"
                type="range"
                min="0.5"
                max="0.85"
                step="0.001"
                value={simAuc}
                onChange={(e) => {
                  setTouched(true);
                  setSimAuc(Number(e.target.value));
                }}
              />
              <output htmlFor="simAuc">{simAuc.toFixed(3)}</output>
            </div>

            <div className="sr">
              <label htmlFor="simD">model capacity d</label>
              <input
                id="simD"
                type="range"
                min="4"
                max="80"
                step="1"
                value={simD}
                onChange={(e) => {
                  setTouched(true);
                  setSimD(Number(e.target.value));
                }}
              />
              <output htmlFor="simD">{simD}</output>
            </div>
          </div>

          <div className={`verdict ${isReady ? 'ready' : ''}`}>
            {isReady ? (
              <>
                Gate open (100%). The proven floor sits at <b>{currentFloor.toFixed(3)}</b>, clear of 0.600. WEIR has earned the launch!
              </>
            ) : (
              <>
                Measured <b>{simAuc.toFixed(3)}</b>, but ε takes <b>{currentEps >= 1 ? 'all of it' : currentEps.toFixed(3)}</b>. Floor is <b>{currentFloor.toFixed(3)}</b>.
              </>
            )}
          </div>

          <div className="btnrow">
            <button
              type="button"
              className="btn btn-live"
              onClick={() => {
                setTouched(false);
                if (modelLoaded && model.n > 0) {
                  setSimN(model.n);
                  setSimAuc(model.auc || 0.548);
                  setSimD(model.d || 37);
                }
              }}
            >
              Sync Live DB (<span>{model.n ? model.n.toLocaleString('en-US') : '0'}</span>)
            </button>

            <button
              type="button"
              className="btn btn-acc"
              onClick={() => {
                setTouched(true);
                const n = 9600;
                const d = simD || 37;
                setSimN(n);
                setSimAuc(Math.min(0.85, Number((TARGET + epsCalc(n, d) + 0.001).toFixed(3))));
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4 5v14l8-7zm8 0v14l8-7z" />
              </svg>
              Fill to Target AUC 0.60
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setTouched(true);
                setSimN(340);
                setSimAuc(0.548);
                setSimD(37);
              }}
            >
              Reset day 1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
