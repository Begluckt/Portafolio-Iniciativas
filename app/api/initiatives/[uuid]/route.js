import { NextResponse } from 'next/server';
import { getInitiative, updateInitiative, deleteInitiative } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { uuid } = await params;
    const initiative = await getInitiative(uuid);
    if (!initiative) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(initiative);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch initiative' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { uuid } = await params;
    const data = await request.json();
    const updated = await updateInitiative(uuid, data);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    // Log history (fire and forget for now, or await)
    try {
      const { getDb } = await import('../../../../lib/db');
      const db = await getDb();
      const newLog = {
        initiative_id: uuid,
        action: 'UPDATED',
        changed_by: 'system',
        changes: { status: data.ini_status, timestamp: new Date().toISOString() },
        created_at: new Date().toISOString()
      };
      
      if (db.isSupabase) {
        await db.client.from('audit_logs').insert([newLog]);
      } else {
        const logsKey = `history:${uuid}`;
        const logsStr = await db.client.get(logsKey);
        const logs = logsStr ? JSON.parse(logsStr) : [];
        newLog.id = Date.now().toString();
        logs.unshift(newLog);
        await db.client.set(logsKey, JSON.stringify(logs));
      }
    } catch(e) {
      console.error('Audit log error', e);
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update initiative' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { uuid } = await params;
    await deleteInitiative(uuid);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete initiative' }, { status: 500 });
  }
}
