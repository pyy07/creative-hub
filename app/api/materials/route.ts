import { NextRequest, NextResponse } from 'next/server';
import { listMaterials, createMaterial } from '../../../src/db';

export async function GET() {
  const materials = listMaterials();
  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const material = createMaterial({
    title: body.title || '',
    type: body.type || 'text',
    content: body.content || '',
  });
  return NextResponse.json(material, { status: 201 });
}
