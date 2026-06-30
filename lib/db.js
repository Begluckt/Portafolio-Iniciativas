import { kv } from '@vercel/kv';
import crypto from 'crypto';

const DB_KEY = 'initiatives_db';

export async function getInitiatives() {
  try {
    const data = await kv.get(DB_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error KV getInitiatives:", error);
    return [];
  }
}

export async function saveInitiatives(initiatives) {
  try {
    await kv.set(DB_KEY, initiatives);
  } catch (error) {
    console.error("Error KV saveInitiatives:", error);
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
