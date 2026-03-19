import { NextRequest, NextResponse } from 'next/server';
import { updateArticle, deleteArticle, getArticle } from '../../../../src/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const article = await updateArticle(id, {
    title: body.title,
    content: body.content,
    status: body.status,
    platforms: body.platforms,
    tags: body.tags,
  });
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await deleteArticle(id);
  return NextResponse.json({ ok: true });
}
