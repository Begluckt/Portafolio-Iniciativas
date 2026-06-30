import { NextResponse } from 'next/server';
import { getInitiatives, createInitiative } from '../../../lib/db';

export async function GET() {
  try {
    const initiatives = await getInitiatives();
    return NextResponse.json(initiatives);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const newInitiative = await createInitiative(data);
    return NextResponse.json(newInitiative, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 });
  }
}
