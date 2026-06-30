import { NextResponse } from 'next/server';
import { getInitiative, updateInitiative, deleteInitiative } from '../../../../lib/db';

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
