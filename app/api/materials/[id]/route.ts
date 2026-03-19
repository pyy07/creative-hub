import { NextRequest, NextResponse } from 'next/server';
import { deleteMaterial } from '../../../../src/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteMaterial(id);
  return NextResponse.json({ ok: true });
}
