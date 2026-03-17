export async function generateInspiration(query: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'inspiration', query }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate inspiration');
  }

  const data = await response.json();
  return data.result || '';
}

export async function adaptContent(content: string, platform: 'wechat' | 'xiaohongshu'): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'adapt', content, platform }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to adapt content');
  }

  const data = await response.json();
  return data.result || '';
}
