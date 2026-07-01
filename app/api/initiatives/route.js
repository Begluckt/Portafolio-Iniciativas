import { NextResponse } from 'next/server';
import { getInitiatives, createInitiative } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const segment = searchParams.get('segment') || 'all';
    
    const filters = { search, segment };
    const initiatives = await getInitiatives(filters);
    return NextResponse.json(initiatives);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const newInitiative = await createInitiative(data);
    
    // Log history
    try {
      const { getDb } = await import('../../../lib/db');
      const db = await getDb();
      const newLog = {
        initiative_id: newInitiative.uuid || newInitiative.id,
        action: 'CREATED',
        changed_by: 'system',
        changes: { status: newInitiative.ini_status, timestamp: new Date().toISOString() },
        created_at: new Date().toISOString()
      };
      
      if (db.isSupabase) {
        await db.client.from('audit_logs').insert([newLog]);
      } else {
        const logsKey = `history:${newLog.initiative_id}`;
        newLog.id = Date.now().toString();
        await db.client.set(logsKey, JSON.stringify([newLog]));
      }
    } catch(e) {
      console.error('Audit log error', e);
    }

    return NextResponse.json(newInitiative, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 });
  }
}
