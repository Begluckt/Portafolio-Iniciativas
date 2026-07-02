import crypto from 'crypto';
import { createClient as createSupabaseClient } from '../utils/supabase/server';

export async function getDb() {
  return {
    isSupabase: true,
    client: await createSupabaseClient()
  };
}

export async function getInitiatives(filters = {}) {
  const supabase = await createSupabaseClient();
  let query = supabase.from('initiatives').select('*');
  
  if (filters.search) {
    query = query.ilike('ini_name', `%${filters.search}%`);
  }
  if (filters.segment && filters.segment !== 'all') {
    query = query.eq('segment_type', filters.segment);
  }
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

export async function saveInitiatives(initiatives) {
  const supabase = await createSupabaseClient();
  const mapped = initiatives.map(d => {
    return {
      uuid: d.uuid || d.id || crypto.randomUUID(),
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
      created_at: d.createdAt,
      updated_at: d.updatedAt
    };
  });

  const { error } = await supabase.from('initiatives').upsert(mapped);
  if (error) {
    console.error("Supabase upsert bulk error:", error);
    throw error;
  }
  return true;
}

export async function clearInitiatives() {
  throw new Error("clearInitiatives no está soportado. Elimina registros directamente en Supabase.");
}
