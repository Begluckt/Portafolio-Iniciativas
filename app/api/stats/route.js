import { NextResponse } from 'next/server';
import { getInitiatives } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const all = await getInitiatives(); // No filters = get all
    const total = all.length;
    const countB2B = all.filter(i => i.segment_type === 'B2B').length;
    const countB2C = all.filter(i => i.segment_type === 'B2C').length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const countRecent = all.filter(i => new Date(i.updatedAt) >= thirtyDaysAgo).length;

    return NextResponse.json({ total, countB2B, countB2C, countRecent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
