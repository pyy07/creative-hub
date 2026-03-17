import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, query, content, platform } = body;

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
    }

    if (action === 'inspiration') {
      if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

      const result = await callOpenAI([
        {
          role: 'user',
          content: `你是一个内容创作助手。用户正在寻找关于 "${query}" 的创作灵感。
请提供以下内容：
1. 3-5个吸引人的标题建议。
2. 核心观点或大纲。
3. 相关的素材或案例参考。
4. 针对微信公众号和小红书的不同风格建议。
请使用 Markdown 格式输出。`,
        },
      ]);

      return NextResponse.json({ result });
    }

    if (action === 'adapt') {
      if (!content || !platform) {
        return NextResponse.json({ error: 'content and platform are required' }, { status: 400 });
      }

      const prompt = platform === 'wechat'
        ? '你是一个资深的微信公众号编辑。请将以下内容适配为微信公众号文章。要求：1. 拟定一个吸引人的标题。2. 内容排版精美，语气专业且有深度。3. 包含摘要和结语。请严格按照以下格式输出：\n【标题】：(这里写标题)\n【正文】：(这里写正文内容)'
        : '你是一个小红书爆款博主。请将以下内容适配为小红书笔记。要求：1. 拟定一个带情绪价值的标题。2. 语气活泼，多用表情符号。3. 分段清晰，包含热门标签。4. 字数精简。请严格按照以下格式输出：\n【标题】：(这里写标题)\n【正文】：(这里写正文内容)';

      const result = await callOpenAI([
        {
          role: 'user',
          content: `${prompt}\n\n原文章内容：\n${content}`,
        },
      ]);

      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
