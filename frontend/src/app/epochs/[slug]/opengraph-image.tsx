import { ImageResponse } from 'next/og';
import { EPOCH_COPY, EPOCH_SHARE } from '@/config/epochsCopy';

export const alt = 'WEIR Runs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

const BACKEND = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

async function readStatus(id: number): Promise<{ status: string; completedAt: string | null } | null> {
  try {
    const res = await fetch(`${BACKEND}/api/epochs`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const e = data.epochs?.find((x: { id: number }) => x.id === id);
    return e ? { status: e.status, completedAt: e.completed_at } : null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const epoch = EPOCH_SHARE.find((e) => e.anchor === slug) ?? EPOCH_SHARE[0];
  const live = await readStatus(epoch.id);
  const statusLine = !live
    ? null
    : live.status === 'complete'
      ? `Unlocked${live.completedAt ? ` · ${live.completedAt.slice(0, 16).replace('T', ' ')} UTC` : ''}`
      : live.status === 'active'
        ? 'Now'
        : 'Locked';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: '#0C181C', color: '#F4F7F8', padding: '72px 80px', fontFamily: 'sans-serif',
        border: `8px solid ${live?.status === 'complete' || live?.status === 'active' ? '#D48872' : 'rgba(244,247,248,.10)'}` }}>
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#D48872', textTransform: 'uppercase' }}>
          WEIR · Runs
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40 }}>
          <div style={{ display: 'flex', fontSize: 190, fontStyle: 'italic', fontFamily: 'serif', color: '#D48872', lineHeight: 1 }}>
            {epoch.numeral}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
            <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>{epoch.name}</div>
            <div style={{ display: 'flex', fontSize: 30, color: '#94A3B8', marginTop: 18, lineHeight: 1.3 }}>
              {EPOCH_COPY[epoch.key]?.oneLine || 'Model convergence and weir locks'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#94A3B8' }}>
          <div style={{ display: 'flex' }}>What the water unlocks.</div>
          {statusLine && <div style={{ display: 'flex', color: '#D48872' }}>{statusLine}</div>}
        </div>
      </div>
    ),
    size,
  );
}
