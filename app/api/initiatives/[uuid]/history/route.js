import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const db = await getDb();
    
    // Si estamos en Supabase
    if (db.isSupabase) {
      const { data, error } = await db.client
        .from('audit_logs')
        .select('*')
        .eq('initiative_id', params.uuid)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return NextResponse.json(data || []);
    }
    
    // Fallback a Redis (mock o en memoria para audit logs)
    const logsKey = `history:${params.uuid}`;
    const logsStr = await db.client.get(logsKey);
    const logs = logsStr ? JSON.parse(logsStr) : [];
    
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const newLog = {
      initiative_id: params.uuid,
      action: body.action,
      changed_by: body.changed_by || 'system',
      changes: body.changes || {},
      created_at: new Date().toISOString()
    };
    
    if (db.isSupabase) {
      const { data, error } = await db.client
        .from('audit_logs')
        .insert([newLog])
        .select();
        
      if (error) throw error;
      return NextResponse.json(data[0]);
    }
    
    // Fallback Redis
    const logsKey = `history:${params.uuid}`;
    const logsStr = await db.client.get(logsKey);
    const logs = logsStr ? JSON.parse(logsStr) : [];
    
    newLog.id = Date.now().toString();
    logs.unshift(newLog); // Add to beginning
    await db.client.set(logsKey, JSON.stringify(logs));
    
    return NextResponse.json(newLog);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
