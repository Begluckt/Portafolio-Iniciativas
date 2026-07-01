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

export async function getDb() {
  const isSupa = isSupabaseConfigured();
  return {
    isSupabase: isSupa,
    client: isSupa ? await createSupabaseClient() : kv
  };
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
    const mapped = initiatives.map(d => {
      const dbObj = {
        uuid: d.uuid || d.id,
        ini_id: d.ini_id,
        ini_status: d.ini_status || 'En Evaluación',
        ini_name: d.ini_name,
        ini_owner: d.ini_owner,
        ini_sponsor: d.ini_sponsor,
        ini_objective: d.ini_objective,
        ini_segment: d.ini_segment,
        ini_problem: d.ini_problem,
        ini_context: d.ini_context,
        ini_desired: d.ini_desired,
        ini_impacted: d.ini_impacted,
        ini_benefit: d.ini_benefit,
        ini_benefit_desc: d.ini_benefit_desc,
        ini_goal: d.ini_goal,
        ini_capture_date: d.ini_capture_date,
        ini_measurement: d.ini_measurement,
        val_revenue: d.val_revenue,
        val_efficiency: d.val_efficiency,
        val_experience: d.val_experience,
        val_other: d.val_other,
        dur_time: d.dur_time,
        dur_cost: d.dur_cost,
        dur_uncertainty: d.dur_uncertainty,
        dur_capacity: d.dur_capacity,
        ini_evaluation_detail: d.ini_evaluation_detail,
        brand: d.brand,
        segment_type: d.segment_type,
        network: d.network,
        impact: d.impact,
        created_at: d.createdAt || d.created_at || new Date().toISOString(),
        updated_at: d.updatedAt || d.updated_at || new Date().toISOString()
      };
      
      // Eliminar claves undefined para evitar que Supabase intente insertar nulls en lugar de defaults
      Object.keys(dbObj).forEach(key => dbObj[key] === undefined && delete dbObj[key]);
      
      return dbObj;
    });
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
    const dbObj = {
      uuid: data.uuid,
      ini_id: data.ini_id,
      ini_status: data.ini_status || 'En Evaluación',
      ini_name: data.ini_name,
      ini_owner: data.ini_owner,
      ini_sponsor: data.ini_sponsor,
      ini_objective: data.ini_objective,
      ini_segment: data.ini_segment,
      ini_problem: data.ini_problem,
      ini_context: data.ini_context,
      ini_desired: data.ini_desired,
      ini_impacted: data.ini_impacted,
      ini_benefit: data.ini_benefit,
      ini_benefit_desc: data.ini_benefit_desc,
      ini_goal: data.ini_goal,
      ini_capture_date: data.ini_capture_date,
      ini_measurement: data.ini_measurement,
      val_revenue: data.val_revenue,
      val_efficiency: data.val_efficiency,
      val_experience: data.val_experience,
      val_other: data.val_other,
      dur_time: data.dur_time,
      dur_cost: data.dur_cost,
      dur_uncertainty: data.dur_uncertainty,
      dur_capacity: data.dur_capacity,
      ini_evaluation_detail: data.ini_evaluation_detail,
      brand: data.brand,
      segment_type: data.segment_type,
      network: data.network,
      impact: data.impact,
      created_at: data.createdAt,
      updated_at: data.updatedAt
    };
    Object.keys(dbObj).forEach(key => dbObj[key] === undefined && delete dbObj[key]);
    
    const { error } = await supabase.from('initiatives').insert(dbObj);
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
    const dbObj = {
      ini_id: data.ini_id,
      ini_status: data.ini_status,
      ini_name: data.ini_name,
      ini_owner: data.ini_owner,
      ini_sponsor: data.ini_sponsor,
      ini_objective: data.ini_objective,
      ini_segment: data.ini_segment,
      ini_problem: data.ini_problem,
      ini_context: data.ini_context,
      ini_desired: data.ini_desired,
      ini_impacted: data.ini_impacted,
      ini_benefit: data.ini_benefit,
      ini_benefit_desc: data.ini_benefit_desc,
      ini_goal: data.ini_goal,
      ini_capture_date: data.ini_capture_date,
      ini_measurement: data.ini_measurement,
      val_revenue: data.val_revenue,
      val_efficiency: data.val_efficiency,
      val_experience: data.val_experience,
      val_other: data.val_other,
      dur_time: data.dur_time,
      dur_cost: data.dur_cost,
      dur_uncertainty: data.dur_uncertainty,
      dur_capacity: data.dur_capacity,
      ini_evaluation_detail: data.ini_evaluation_detail,
      brand: data.brand,
      segment_type: data.segment_type,
      network: data.network,
      impact: data.impact,
      updated_at: data.updatedAt
    };
    Object.keys(dbObj).forEach(key => dbObj[key] === undefined && delete dbObj[key]);

    const { error } = await supabase.from('initiatives').update(dbObj).eq('uuid', uuid);
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
