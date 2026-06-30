import { NextResponse } from 'next/server';
import { getInitiatives, saveInitiatives } from '../../../../lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const data = await request.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Expected an array of initiatives' }, { status: 400 });
    }

    const currentInitiatives = await getInitiatives();
    const existingUuids = new Set(currentInitiatives.map(i => i.uuid));

    let importedCount = 0;
    for (const ini of data) {
      if (!ini.uuid) {
        ini.uuid = crypto.randomUUID();
      }
      if (!existingUuids.has(ini.uuid)) {
        if (!ini.createdAt) ini.createdAt = new Date().toISOString();
        if (!ini.updatedAt) ini.updatedAt = ini.createdAt;
        currentInitiatives.push(ini);
        existingUuids.add(ini.uuid);
        importedCount++;
      } else {
        // Update existing
        const idx = currentInitiatives.findIndex(i => i.uuid === ini.uuid);
        if (idx !== -1) {
          ini.updatedAt = new Date().toISOString();
          currentInitiatives[idx] = { ...currentInitiatives[idx], ...ini };
          importedCount++;
        }
      }
    }

    await saveInitiatives(currentInitiatives);
    return NextResponse.json({ message: 'Import successful', imported: importedCount }, { status: 200 });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: 'Failed to import initiatives' }, { status: 500 });
  }
}
