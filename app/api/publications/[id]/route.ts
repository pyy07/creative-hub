import { NextRequest, NextResponse } from 'next/server';
import { deletePublication } from '../../../../src/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deletePublication(id);
  return NextResponse.json({ ok: true });
}
