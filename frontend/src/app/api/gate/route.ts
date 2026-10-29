import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    proven_floor: 0.584,
    gate_level: 0.840,
    jar_level: 0.840,
    locks: {
      lock_samples: true,
      lock_cleared: true,
      lock_stability: true,
      lock_no_lookahead: true,
    },
    gates: {
      lock_samples: true,
      lock_cleared: true,
      lock_stability: true,
      lock_no_lookahead: true,
    },
    held_by_lock: null,
    blocked_by: null,
    capacity_d: 37,
    auc_target: 0.60,
    auc_floor: 0.50,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
      'Content-Type': 'application/json',
    },
  });
}
