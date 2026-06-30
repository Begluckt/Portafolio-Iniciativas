import { createClient } from '@vercel/kv';
import crypto from 'crypto';

const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const DB_KEY = 'initiatives_db';

export async function getInitiatives() {
  try {
    const data = await kv.get(DB_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error KV getInitiatives:", error, "ENV URL:", !!process.env.KV_REST_API_URL, "UPSTASH:", !!process.env.UPSTASH_REDIS_REST_URL);
    return [];
  }
}

export async function saveInitiatives(initiatives) {
  const result = await kv.set(DB_KEY, initiatives);
  if (!result) {
    throw new Error("KV set returned falsy");
  }
}

export async function getInitiative(uuid) {
  const initiatives = await getInitiatives();
  return initiatives.find(i => i.uuid === uuid);
}

export async function createInitiative(data) {
  const initiatives = await getInitiatives();
  data.uuid = crypto.randomUUID();
  data.createdAt = new Date().toISOString();
  data.updatedAt = data.createdAt;
  initiatives.push(data);
  await saveInitiatives(initiatives);
  return data;
}

export async function updateInitiative(uuid, data) {
  const initiatives = await getInitiatives();
  const index = initiatives.findIndex(i => i.uuid === uuid);
  if (index > -1) {
    data.updatedAt = new Date().toISOString();
    data.createdAt = initiatives[index].createdAt; // preserve creation
    initiatives[index] = { ...initiatives[index], ...data };
    await saveInitiatives(initiatives);
    return initiatives[index];
  }
  return null;
}

export async function deleteInitiative(uuid) {
  let initiatives = await getInitiatives();
  initiatives = initiatives.filter(i => i.uuid !== uuid);
  await saveInitiatives(initiatives);
}
