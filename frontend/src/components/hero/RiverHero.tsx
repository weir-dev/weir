'use client';

import React from 'react';
import { useEmileStore } from '@/store/useEmileStore';

export const RiverHero: React.FC = () => {
  const model = useEmileStore((state) => state.model);
  const gateLevelPct = (model.gate_level || 0) * 100;
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="scene">
      <div 
        className="glow" 
        style={{ top: '15%', right: '15%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} 
      />
      <div 
        className="glow" 
        style={{ bottom: '20px', left: '20px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(252,100,35,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} 
      />
      <div 
        className="glow" 
        style={{ top: '50%', left: '40%', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', filter: 'blur(50px)' }} 
      />

      <div className="media border border-[var(--rule)] shadow-2xl">
        <video 
          ref={videoRef}
          src="/videos/salmon.mp4" 
          poster="/brand/kip-hero.jpg"
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="Kip the Salmon at the WEIR station"
        />
        <div className="vign" aria-hidden="true" />
        
        {/* Glass Readouts */}
        <div className="glass-read l border border-[var(--rule)] backdrop-blur-md bg-black/40 shadow-xl" aria-label="Gate progress readout">
          <div className="bar" aria-hidden="true">
            <i style={{ height: `${Math.max(0, Math.min(100, gateLevelPct))}%`, background: 'linear-gradient(to top, #06B6D4, #10B981, #FC6423)' }} />
          </div>
          <div>
            <div className="k text-[var(--cyan)]">Gate Level</div>
            <div className="v text-[var(--live)] font-bold text-shadow-sm">
              {gateLevelPct.toFixed(1)}<small className="text-[var(--live)]">%</small>
            </div>
          </div>
        </div>

        <div className="glass-read r border border-[var(--rule)] backdrop-blur-md bg-black/40 shadow-xl">
          <span className="k text-[var(--banana-hi)] font-mono font-bold tracking-widest">WEIR MANDATE</span>
          <b className="text-white text-shadow-sm">Few clear the falls. We count every one.</b>
        </div>

        {/* Live Chips */}
        <div className="chip l border border-purple-500/35 bg-black/70 shadow-[0_0_14px_rgba(168,85,247,0.3)]">
          <i className="bg-gradient-to-r from-purple-500 to-cyan-400" />
          <span className="font-semibold text-purple-200">Solana Mainnet</span>
        </div>
        <div className="chip r border border-emerald-500/35 bg-black/70 shadow-[0_0_14px_rgba(16,185,129,0.3)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Feed: <b className="text-emerald-300 font-bold">Live Ingest</b></span>
        </div>
      </div>

      <div className="scene-cap text-xs font-mono">
        <span className="text-[var(--live)] font-bold">Kip the salmon</span> counts every token at the weir · All counts live on <span className="text-[var(--violet)] font-bold">Solana</span>
      </div>
    </div>
  );
};
