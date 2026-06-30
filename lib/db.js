import Redis from 'ioredis';
import crypto from 'crypto';

// If running at build time or without env vars, avoid crashing
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const kv = redisUrl ? new Redis(redisUrl) : null;

const DB_KEY = 'initiatives_db';

export async function getInitiatives() {
  if (!kv) return [];
  try {
    const dataStr = await kv.get(DB_KEY);
    if (!dataStr) return [];
    const data = JSON.parse(dataStr);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error Redis getInitiatives:", error, "URL present:", !!redisUrl);
    return [];
  }
}

export async function saveInitiatives(initiatives) {
  if (!kv) throw new Error("No Redis connection configured");
  const result = await kv.set(DB_KEY, JSON.stringify(initiatives));
  if (result !== 'OK') {
    throw new Error("Redis set failed: " + result);
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
