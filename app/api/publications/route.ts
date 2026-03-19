import { NextRequest, NextResponse } from 'next/server';
import { listPublications, createPublication } from '../../../src/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get('articleId') || undefined;
  const publications = await listPublications(articleId);
  return NextResponse.json(publications);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const publication = await createPublication({
    articleId: body.articleId || '',
    platform: body.platform || 'wechat',
    title: body.title || '',
    content: body.content || '',
  });
  return NextResponse.json(publication, { status: 201 });
}
