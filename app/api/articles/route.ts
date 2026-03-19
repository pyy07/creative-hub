import { NextRequest, NextResponse } from 'next/server';
import { listArticles, createArticle } from '../../../src/db';

export async function GET() {
  const articles = await listArticles();
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const article = await createArticle({
    title: body.title || '',
    content: body.content || '',
    status: body.status || 'draft',
    platforms: body.platforms || [],
    tags: body.tags || [],
  });
  return NextResponse.json(article, { status: 201 });
}
