import { NextRequest, NextResponse } from 'next/server';
import { createInspiration } from '../../../src/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const inspiration = createInspiration({
    query: body.query || '',
    results: body.results || '',
  });
  return NextResponse.json(inspiration, { status: 201 });
}
