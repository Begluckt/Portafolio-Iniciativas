import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const db = await getDb();
    
    // Si estamos en Supabase
    if (db.isSupabase) {
      const { data, error } = await db.client
        .from('comments')
        .select('*')
        .eq('initiative_id', params.uuid)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return NextResponse.json(data || []);
    }
    
    // Fallback a Redis (mock o en memoria para comentarios)
    const key = `comments:${params.uuid}`;
    const str = await db.client.get(key);
    const comments = str ? JSON.parse(str) : [];
    
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const newComment = {
      initiative_id: params.uuid,
      content: body.content,
      author_id: body.author_id || 'system',
      created_at: new Date().toISOString()
    };
    
    if (db.isSupabase) {
      const { data, error } = await db.client
        .from('comments')
        .insert([newComment])
        .select();
        
      if (error) throw error;
      return NextResponse.json(data[0]);
    }
    
    // Fallback Redis
    const key = `comments:${params.uuid}`;
    const str = await db.client.get(key);
    const comments = str ? JSON.parse(str) : [];
    
    newComment.id = Date.now().toString();
    comments.push(newComment); // Add to end
    await db.client.set(key, JSON.stringify(comments));
    
    return NextResponse.json(newComment);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
