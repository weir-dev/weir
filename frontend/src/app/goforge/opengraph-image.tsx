import { ImageResponse } from 'next/og';
import { GOFORGE_HERO } from '@/config/goforgeCopy';

export const alt = 'GoForge by WEIR';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: '#0C181C', color: '#F4F7F8', padding: '72px 80px', fontFamily: 'sans-serif',
          border: '8px solid #D48872',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#D48872', textTransform: 'uppercase' }}>
          WEIR · Launches
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 150, fontWeight: 700, lineHeight: 1 }}>{GOFORGE_HERO.title}</div>
          <div style={{ display: 'flex', fontSize: 48, fontStyle: 'italic', fontFamily: 'serif', color: '#D48872', marginTop: 16 }}>
            {GOFORGE_HERO.subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#94A3B8' }}>
          Every launch explained, win or lose. weircount.xyz/token
        </div>
      </div>
    ),
    size,
  );
}
