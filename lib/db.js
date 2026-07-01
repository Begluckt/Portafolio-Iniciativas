import Redis from 'ioredis';
import crypto from 'crypto';
import { createClient as createSupabaseClient } from '../utils/supabase/server';

// REDIS FALLBACK CONFIG
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const kv = redisUrl ? new Redis(redisUrl) : null;
const DB_KEY = 'initiatives_db';

function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getInitiatives(filters = {}) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    let query = supabase.from('initiatives').select('*');
    
    if (filters.search) {
      query = query.ilike('ini_name', `%${filters.search}%`);
    }
    if (filters.segment && filters.segment !== 'all') {
      query = query.eq('segment_type', filters.segment);
    }
    // Add pagination if provided
    if (filters.limit) {
      const page = filters.page || 1;
      const start = (page - 1) * filters.limit;
      query = query.range(start, start + filters.limit - 1);
    }
    
    query = query.order('updated_at', { ascending: false });
    const { data, error } = await query;

    if (error) {
      console.error("Supabase getInitiatives error:", error);
      return [];
    }
    return (data || []).map(d => ({
      ...d,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  // Fallback to Redis
  if (!kv) return [];
  try {
    const dataStr = await kv.get(DB_KEY);
    if (!dataStr) return [];
    let data = JSON.parse(dataStr);
    if (!Array.isArray(data)) return [];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(i => 
        (i.ini_name || '').toLowerCase().includes(q) ||
        (i.ini_owner || '').toLowerCase().includes(q) ||
        (i.ini_id || '').toLowerCase().includes(q)
      );
    }
    if (filters.segment && filters.segment !== 'all') {
      data = data.filter(i => i.segment_type === filters.segment);
    }

    return data;
  } catch (error) {
    console.error("Error Redis getInitiatives:", error);
    return [];
  }
}

export async function saveInitiatives(initiatives) {
  // saveInitiatives is only used by bulk import or Redis fallback.
  // In Supabase, we shouldn't use saveInitiatives to save the whole array.
  // But for bulk import (which calls saveInitiatives in the current code), we'll handle it.
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const mapped = initiatives.map(d => ({
      ...d,
      created_at: d.createdAt || new Date().toISOString(),
      updated_at: d.updatedAt || new Date().toISOString()
    }));
    const { error } = await supabase.from('initiatives').upsert(mapped);
    if (error) throw error;
    return;
  }

  if (!kv) throw new Error("No Database connection configured");
  const result = await kv.set(DB_KEY, JSON.stringify(initiatives));
  if (result !== 'OK') {
    throw new Error("Redis set failed: " + result);
  }
}

export async function getInitiative(uuid) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('initiatives').select('*').eq('uuid', uuid).single();
    if (error || !data) return null;
    return { ...data, createdAt: data.created_at, updatedAt: data.updated_at };
  }

  const initiatives = await getInitiatives();
  return initiatives.find(i => i.uuid === uuid);
}

export async function createInitiative(data) {
  data.uuid = data.uuid || crypto.randomUUID();
  data.createdAt = data.createdAt || new Date().toISOString();
  data.updatedAt = data.createdAt;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const dbData = { ...data, created_at: data.createdAt, updated_at: data.updatedAt };
    delete dbData.createdAt;
    delete dbData.updatedAt;
    
    const { error } = await supabase.from('initiatives').insert(dbData);
    if (error) throw error;
    return data;
  }

  const initiatives = await getInitiatives();
  initiatives.push(data);
  await saveInitiatives(initiatives);
  return data;
}

export async function updateInitiative(uuid, data) {
  data.updatedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const dbData = { ...data, updated_at: data.updatedAt };
    delete dbData.createdAt;
    delete dbData.updatedAt;
    delete dbData.uuid; // Don't update primary key

    const { error } = await supabase.from('initiatives').update(dbData).eq('uuid', uuid);
    if (error) throw error;
    return await getInitiative(uuid);
  }

  const initiatives = await getInitiatives();
  const index = initiatives.findIndex(i => i.uuid === uuid);
  if (index > -1) {
    data.createdAt = initiatives[index].createdAt; // preserve creation
    initiatives[index] = { ...initiatives[index], ...data };
    await saveInitiatives(initiatives);
    return initiatives[index];
  }
  return null;
}

export async function deleteInitiative(uuid) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('initiatives').delete().eq('uuid', uuid);
    if (error) throw error;
    return;
  }

  let initiatives = await getInitiatives();
  initiatives = initiatives.filter(i => i.uuid !== uuid);
  await saveInitiatives(initiatives);
}
