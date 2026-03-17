export interface Article {
  id?: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  platforms: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id?: string;
  title: string;
  type: 'link' | 'text' | 'image';
  content: string;
  createdAt: string;
}

export interface Inspiration {
  id?: string;
  query: string;
  results: string;
  createdAt: string;
}

export interface Publication {
  id?: string;
  articleId: string;
  platform: 'wechat' | 'xiaohongshu';
  title: string;
  content: string;
  createdAt: string;
}
