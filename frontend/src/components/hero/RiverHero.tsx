'use client';

import React from 'react';
import { useEmileStore } from '@/store/useEmileStore';

export const RiverHero: React.FC = () => {
  const model = useEmileStore((state) => state.model);
  const gateLevelPct = Math.round((model.gate_level || 0) * 100);
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
        style={{ top: '25%', right: '25%', width: '288px', height: '288px', background: 'var(--live)', filter: 'blur(90px)' }} 
      />
      <div 
        className="glow" 
        style={{ bottom: '40px', left: '40px', width: '240px', height: '240px', background: 'var(--banana-hi)', filter: 'blur(80px)' }} 
      />

      <div className="media">
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
        <div className="glass-read l" aria-label="Gate progress readout">
          <div className="bar" aria-hidden="true">
            <i style={{ height: `${Math.max(0, Math.min(100, gateLevelPct))}%` }} />
          </div>
          <div>
            <div className="k">Gate Level</div>
            <div className="v">
              {gateLevelPct.toFixed(1)}<small>%</small>
            </div>
          </div>
        </div>

        <div className="glass-read r">
          <span className="k">WEIR Mandate</span>
          <b>Few clear the falls. We count every one.</b>
        </div>

        {/* Live Chips */}
        <div className="chip l">
          <i />
          <span>Solana Mainnet</span>
        </div>
        <div className="chip r">
          <span>Feed: <b>Live Ingest</b></span>
        </div>
      </div>

      <div className="scene-cap">
        Kip the salmon counts every token at the weir · All counts live on Solana
      </div>
    </div>
  );
};
