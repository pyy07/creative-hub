"use client";

import React, { useState, useEffect, useId } from 'react';
import mermaid from 'mermaid';
import ReactECharts from 'echarts-for-react';
import { Article, Material, Publication } from '../src/types';
import { generateInspiration, adaptContent } from '../src/services/aiService';
import {
  PenLine,
  Sparkles,
  Library,
  LogOut,
  Plus,
  Search,
  Save,
  Send,
  Trash2,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  History,
  Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'inspiration' | 'editor' | 'library' | 'publications' | 'materials';

// --- Mermaid Support ---

const Mermaid = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(svg);
      } catch (error) {
        console.error('Mermaid render error:', error);
      }
    };
    renderChart();
  }, [chart, id]);

  return <div className="flex justify-center my-4" dangerouslySetInnerHTML={{ __html: svg }} />;
};

// --- ECharts Support ---

const ECharts = ({ option }: { option: string }) => {
  try {
    const parsedOption = JSON.parse(option);
    return (
      <div className="my-4 bg-white p-4 rounded-xl border border-[#5A5A40]/10 shadow-sm overflow-hidden">
        <ReactECharts option={parsedOption} style={{ height: '400px', width: '100%' }} />
      </div>
    );
  } catch (error) {
    return (
      <div className="my-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-mono">
        ECharts 解析错误: {String(error)}
      </div>
    );
  }
};

const MarkdownPreview = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match ? match[1] : '';

          // 代码块（非行内）
          if (!inline && lang) {
            if (lang === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }
            if (lang === 'echarts') {
              return <ECharts option={String(children).replace(/\n$/, '')} />;
            }
            // 清理代码内容中的反引号
            let code = String(children);
            code = code.replace(/^```\w*$/gm, '').replace(/^`+/, '').replace(/`+$/, '');

            return (
              <SyntaxHighlighter
                language={lang}
                style={prism}
                PreTag="div"
                customStyle={{
                  backgroundColor: 'transparent',
                  borderRadius: '1rem',
                  padding: '1rem',
                  margin: '1rem 0',
                  border: '1px solid rgba(90, 90, 64, 0.1)',
                  fontSize: '0.875rem',
                }}
              >
                {code.replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          }

          // 行内代码
          return (
            <code className={className} style={{ backgroundColor: 'transparent' }} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// --- Login Page ---

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setError('密码错误，请重试');
      }
    } catch {
      setError('登录失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f0]">
      <div className="bg-white rounded-[32px] p-10 shadow-xl w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#5A5A40] rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a]">CreativeHub</h1>
          <p className="text-sm text-[#5A5A40] mt-1">请输入访问密码</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码..."
              className="w-full pl-12 pr-4 py-3 bg-[#f5f5f0] rounded-xl outline-none focus:ring-2 ring-[#5A5A40]/20 text-[#1a1a1a]"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#5A5A40] text-white rounded-xl font-medium hover:bg-[#4a4a35] transition-colors disabled:opacity-50"
          >
            {loading ? '验证中...' : '进入'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main App ---

export default function Page() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<View>('inspiration');
  const [articles, setArticles] = useState<Article[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'var(--font-sans)',
    });
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const loadArticles = async () => {
    const res = await fetch('/api/articles');
    if (res.ok) setArticles(await res.json());
  };

  const loadMaterials = async () => {
    const res = await fetch('/api/materials');
    if (res.ok) setMaterials(await res.json());
  };

  useEffect(() => {
    if (authenticated) {
      loadArticles();
      loadMaterials();
    }
  }, [authenticated]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
  };

  if (authenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="animate-pulse flex flex-col items-center">
          <Sparkles className="w-12 h-12 text-[#5A5A40] mb-4" />
          <p className="font-serif italic text-[#5A5A40]">加载中...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="h-screen w-full flex bg-[#f5f5f0] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#5A5A40]/10 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-[#5A5A40]/5">
          <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-lg text-[#1a1a1a]">CreativeHub</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon={<Sparkles className="w-5 h-5" />}
            label="创意灵感"
            active={currentView === 'inspiration'}
            onClick={() => setCurrentView('inspiration')}
          />
          <NavItem
            icon={<PenLine className="w-5 h-5" />}
            label="文章创作"
            active={currentView === 'editor'}
            onClick={() => {
              setCurrentView('editor');
              if (!activeArticle) setActiveArticle(null);
            }}
          />
          <NavItem
            icon={<Library className="w-5 h-5" />}
            label="内容库"
            active={currentView === 'library'}
            onClick={() => setCurrentView('library')}
          />
          <NavItem
            icon={<Send className="w-5 h-5" />}
            label="发布管理"
            active={currentView === 'publications'}
            onClick={() => setCurrentView('publications')}
          />
          <NavItem
            icon={<ImageIcon className="w-5 h-5" />}
            label="素材管理"
            active={currentView === 'materials'}
            onClick={() => setCurrentView('materials')}
          />
        </nav>

        <div className="p-4 border-t border-[#5A5A40]/5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#5A5A40]/5 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a] truncate">管理员</p>
              <p className="text-xs text-[#5A5A40] truncate">已登录</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-3 text-[#5A5A40] hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {currentView === 'inspiration' && <InspirationView onStartWriting={(content) => {
          setActiveArticle({
            title: '新文章',
            content,
            status: 'draft',
            platforms: [],
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setCurrentView('editor');
        }} />}
        {currentView === 'editor' && <EditorView article={activeArticle} onSave={(art) => {
          setActiveArticle(art);
          loadArticles();
        }} />}
        {currentView === 'library' && <LibraryView
          articles={articles}
          onEdit={(art) => {
            setActiveArticle(art);
            setCurrentView('editor');
          }}
          onDelete={async (id) => {
            if (confirm('确定要删除这篇文章吗？')) {
              await fetch(`/api/articles/${id}`, { method: 'DELETE' });
              loadArticles();
            }
          }}
          onPublished={loadArticles}
        />}
        {currentView === 'publications' && <PublicationsView />}
        {currentView === 'materials' && <MaterialsView materials={materials} onChanged={loadMaterials} />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        active
          ? "bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20"
          : "text-[#5A5A40] hover:bg-[#5A5A40]/5"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
    </button>
  );
}

// --- Views ---

function InspirationView({ onStartWriting }: { onStartWriting: (content: string) => void }) {
  const [queryStr, setQueryStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!queryStr.trim()) return;
    setLoading(true);
    try {
      const res = await generateInspiration(queryStr);
      setResult(res || null);
      if (res) {
        await fetch('/api/inspirations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryStr, results: res }),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-serif font-bold text-[#1a1a1a] mb-4">寻找创作灵感</h2>
        <p className="text-[#5A5A40]">输入你的创作主题，AI 将为你提供标题、大纲及素材建议。</p>
      </div>

      <div className="relative mb-8">
        <input
          type="text"
          value={queryStr}
          onChange={(e) => setQueryStr(e.target.value)}
          placeholder="例如：关于极简主义生活的文章..."
          className="w-full bg-white border-2 border-[#5A5A40]/10 rounded-3xl py-6 px-8 pr-20 text-lg focus:border-[#5A5A40] outline-none transition-all shadow-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="absolute right-4 top-4 bottom-4 bg-[#5A5A40] text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-[#4a4a35] transition-colors disabled:opacity-50"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-6 h-6" />}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#5A5A40]/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">AI 建议</h3>
            <button
              onClick={() => onStartWriting(result)}
              className="flex items-center gap-2 text-sm font-medium text-[#5A5A40] hover:underline"
            >
              <PenLine className="w-4 h-4" />
              基于此开始创作
            </button>
          </div>
          <div className="prose-custom">
            <MarkdownPreview content={result} />
          </div>
        </div>
      )}
    </div>
  );
}

function EditorView({ article, onSave }: { article: Article | null, onSave: (art: Article) => void }) {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [showPublication, setShowPublication] = useState<Publication | null>(null);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const container = document.getElementById('editor-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(ratio, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const loadPublications = async (articleId: string) => {
    const res = await fetch(`/api/publications?articleId=${articleId}`);
    if (res.ok) setPublications(await res.json());
  };

  useEffect(() => {
    if (article?.id) {
      loadPublications(article.id);
    } else {
      setPublications([]);
    }
  }, [article?.id]);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [article]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const body = {
        title,
        content,
        status: 'draft',
        platforms: article?.platforms || [],
        tags: article?.tags || [],
      };

      if (article?.id) {
        const res = await fetch(`/api/articles/${article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          onSave(updated);
        }
      } else {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          onSave(created);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="bg-white border-b border-[#5A5A40]/10 p-4 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full text-xl font-serif font-bold text-[#1a1a1a] outline-none placeholder:opacity-30"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#5A5A40] text-white rounded-full hover:bg-[#4a4a35] transition-colors font-medium text-sm shadow-lg shadow-[#5A5A40]/20"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存草稿'}
          </button>
        </div>
      </header>

      <div id="editor-container" className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div style={{ width: `${splitRatio}%` }} className="h-full border-r border-[#5A5A40]/10 p-6 bg-white">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始你的创作..."
            className="w-full h-full resize-none outline-none font-mono text-sm leading-relaxed text-[#1a1a1a] placeholder:opacity-20"
          />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "w-1.5 cursor-col-resize bg-[#5A5A40]/10 hover:bg-[#5A5A40]/30 transition-colors flex-shrink-0",
            isDragging && "bg-[#5A5A40]/40"
          )}
        />

        {/* Preview & History */}
        <div style={{ width: `${100 - splitRatio}%` }} className="h-full flex flex-col overflow-hidden bg-[#fcfcf9]">
          <div className="flex-1 p-6 overflow-auto">
            <div className="mx-auto w-full max-w-4xl">
              <div className="text-xs font-mono text-[#5A5A40]/40 uppercase tracking-widest mb-8">预览</div>
              <div className="prose-custom">
                <MarkdownPreview content={content} />
              </div>
            </div>
          </div>

          {/* Publication History */}
          {publications.length > 0 && (
            <div className="h-1/3 border-t border-[#5A5A40]/10 bg-white p-6 overflow-auto">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-[#5A5A40]" />
                <h4 className="text-sm font-serif font-bold text-[#1a1a1a]">发布历史</h4>
              </div>
              <div className="space-y-3">
                {publications.map(pub => (
                  <div
                    key={pub.id}
                    onClick={() => setShowPublication(pub)}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#5A5A40]/5 hover:bg-[#5A5A40]/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        pub.platform === 'wechat' ? "bg-[#07C160]" : "bg-[#FF2442]"
                      )} />
                      <span className="text-xs font-medium text-[#1a1a1a]">{pub.platform === 'wechat' ? '公众号' : '小红书'}</span>
                      <span className="text-xs text-[#5A5A40]/40 truncate max-w-[200px]">{pub.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5A5A40]/40">
                      {new Date(pub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publication Modal */}
      {showPublication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#5A5A40]/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">{showPublication.platform === 'wechat' ? '公众号' : '小红书'} 发布版本</h3>
                <p className="text-sm text-[#5A5A40]/60">{showPublication.title}</p>
              </div>
              <button onClick={() => setShowPublication(null)} className="p-2 hover:bg-[#5A5A40]/5 rounded-full">
                <X className="w-6 h-6 text-[#5A5A40]" />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-auto prose-custom">
              <MarkdownPreview content={showPublication.content} />
            </div>
            <div className="p-6 bg-[#f5f5f0] flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${showPublication.title}\n\n${showPublication.content}`);
                  alert('已复制到剪贴板');
                }}
                className="px-6 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4a4a35]"
              >
                复制全文
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function LibraryView({ articles, onEdit, onDelete, onPublished }: { articles: Article[], onEdit: (art: Article) => void, onDelete: (id: string) => void, onPublished: () => void }) {
  const [publishing, setPublishing] = useState<string | null>(null);
  const [showPublication, setShowPublication] = useState<Publication | null>(null);

  const handlePublish = async (article: Article, platform: 'wechat' | 'xiaohongshu') => {
    if (!article.id) return;
    const pubKey = `${article.id}_${platform}`;
    setPublishing(pubKey);
    try {
      const res = await adaptContent(article.content, platform);
      if (!res) return;

      const titleMatch = res.match(/【标题】：(.*?)\n/);
      const contentMatch = res.match(/【正文】：([\s\S]*)/);

      const pubTitle = titleMatch ? titleMatch[1].trim() : `${article.title} - ${platform === 'wechat' ? '公众号版' : '小红书版'}`;
      const pubContent = contentMatch ? contentMatch[1].trim() : res;

      const pubRes = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          platform,
          title: pubTitle,
          content: pubContent,
        }),
      });

      if (pubRes.ok) {
        const pub = await pubRes.json();
        setShowPublication(pub);
        onPublished();
      }
    } catch (error) {
      console.error(error);
      alert('发布适配失败，请重试');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">内容库</h2>
        <div className="text-sm text-[#5A5A40] font-medium bg-[#5A5A40]/5 px-4 py-2 rounded-full">
          共 {articles.length} 篇文章
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map(art => (
          <div key={art.id} className="bg-white rounded-[24px] p-6 border border-[#5A5A40]/5 hover:shadow-lg transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-[#5A5A40]/5 rounded-xl">
                <FileText className="w-6 h-6 text-[#5A5A40]" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(art)}
                  className="p-2 text-[#5A5A40] hover:bg-[#5A5A40]/5 rounded-lg transition-colors"
                  title="编辑"
                >
                  <PenLine className="w-4 h-4" />
                </button>
                <button
                  onClick={() => art.id && onDelete(art.id)}
                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-2 group-hover:text-[#5A5A40] transition-colors">{art.title}</h3>
            <p className="text-sm text-[#5A5A40]/60 line-clamp-2 mb-4 leading-relaxed flex-1">
              {art.content.replace(/[#*`]/g, '').slice(0, 100)}...
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handlePublish(art, 'wechat')}
                disabled={!!publishing}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#07C160]/5 text-[#07C160] rounded-xl hover:bg-[#07C160]/10 transition-colors text-xs font-bold disabled:opacity-30"
              >
                {publishing === `${art.id}_wechat` ? '发布中...' : '发布到公众号'}
              </button>
              <button
                onClick={() => handlePublish(art, 'xiaohongshu')}
                disabled={!!publishing}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#FF2442]/5 text-[#FF2442] rounded-xl hover:bg-[#FF2442]/10 transition-colors text-xs font-bold disabled:opacity-30"
              >
                {publishing === `${art.id}_xiaohongshu` ? '发布中...' : '发布到小红书'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#5A5A40]/5">
              <span className="text-xs font-mono text-[#5A5A40]/40">
                {new Date(art.updatedAt).toLocaleDateString()}
              </span>
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md",
                art.status === 'published' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              )}>
                {art.status === 'published' ? '已发布' : '草稿'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Publication Modal */}
      {showPublication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#5A5A40]/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">{showPublication.platform === 'wechat' ? '公众号' : '小红书'} 发布版本</h3>
                <p className="text-sm text-[#5A5A40]/60">{showPublication.title}</p>
              </div>
              <button onClick={() => setShowPublication(null)} className="p-2 hover:bg-[#5A5A40]/5 rounded-full">
                <X className="w-6 h-6 text-[#5A5A40]" />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-auto prose-custom">
              <MarkdownPreview content={showPublication.content} />
            </div>
            <div className="p-6 bg-[#f5f5f0] flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${showPublication.title}\n\n${showPublication.content}`);
                  alert('已复制到剪贴板');
                }}
                className="px-6 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4a4a35]"
              >
                复制全文
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function PublicationsView() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [showPublication, setShowPublication] = useState<Publication | null>(null);

  const load = async () => {
    const res = await fetch('/api/publications');
    if (res.ok) setPublications(await res.json());
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个发布记录吗？')) {
      await fetch(`/api/publications/${id}`, { method: 'DELETE' });
      load();
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">发布管理</h2>
        <div className="text-sm text-[#5A5A40] font-medium bg-[#5A5A40]/5 px-4 py-2 rounded-full">
          共 {publications.length} 个发布版本
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {publications.map(pub => (
          <div key={pub.id} className="bg-white rounded-[24px] p-6 border border-[#5A5A40]/5 hover:shadow-lg transition-all group flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                pub.platform === 'wechat' ? "bg-[#07C160]/10 text-[#07C160]" : "bg-[#FF2442]/10 text-[#FF2442]"
              )}>
                {pub.platform === 'wechat' ? '微信公众号' : '小红书'}
              </div>
              <button
                onClick={() => handleDelete(pub.id!)}
                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-2 group-hover:text-[#5A5A40] transition-colors line-clamp-1">{pub.title}</h3>
            <p className="text-sm text-[#5A5A40]/60 line-clamp-3 mb-6 leading-relaxed flex-1">
              {pub.content.replace(/[#*`]/g, '').slice(0, 150)}...
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-[#5A5A40]/5">
              <span className="text-xs font-mono text-[#5A5A40]/40">
                {new Date(pub.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setShowPublication(pub)}
                className="text-xs font-bold text-[#5A5A40] hover:underline"
              >
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Publication Modal */}
      {showPublication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#5A5A40]/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">{showPublication.platform === 'wechat' ? '公众号' : '小红书'} 发布版本</h3>
                <p className="text-sm text-[#5A5A40]/60">{showPublication.title}</p>
              </div>
              <button onClick={() => setShowPublication(null)} className="p-2 hover:bg-[#5A5A40]/5 rounded-full">
                <X className="w-6 h-6 text-[#5A5A40]" />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-auto prose-custom">
              <MarkdownPreview content={showPublication.content} />
            </div>
            <div className="p-6 bg-[#f5f5f0] flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${showPublication.title}\n\n${showPublication.content}`);
                  alert('已复制到剪贴板');
                }}
                className="px-6 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4a4a35]"
              >
                复制全文
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function MaterialsView({ materials, onChanged }: { materials: Material[], onChanged: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'link' | 'text' | 'image'>('text');
  const [newContent, setNewContent] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, type: newType, content: newContent }),
      });
      setShowAdd(false);
      setNewTitle('');
      setNewContent('');
      onChanged();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个素材吗？')) {
      await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      onChanged();
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">素材管理</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#5A5A40] text-white px-6 py-2 rounded-full font-medium hover:bg-[#4a4a35] transition-colors shadow-lg shadow-[#5A5A40]/20"
        >
          <Plus className="w-4 h-4" />
          添加素材
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(mat => (
          <div key={mat.id} className="bg-white rounded-[24px] p-6 border border-[#5A5A40]/5 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#5A5A40]/5 rounded-xl">
                {mat.type === 'link' && <LinkIcon className="w-5 h-5 text-[#5A5A40]" />}
                {mat.type === 'text' && <FileText className="w-5 h-5 text-[#5A5A40]" />}
                {mat.type === 'image' && <ImageIcon className="w-5 h-5 text-[#5A5A40]" />}
              </div>
              <h3 className="font-serif font-bold text-[#1a1a1a] truncate">{mat.title}</h3>
            </div>
            <div className="text-sm text-[#5A5A40]/70 mb-4 line-clamp-3 bg-[#fcfcf9] p-3 rounded-xl border border-[#5A5A40]/5">
              {mat.content}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#5A5A40]/40">
                {new Date(mat.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => mat.id && handleDelete(mat.id)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-6">添加新素材</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest mb-2 block">标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#f5f5f0] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 ring-[#5A5A40]/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest mb-2 block">类型</label>
                <div className="flex gap-2">
                  {(['text', 'link', 'image'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                        newType === t ? "bg-[#5A5A40] text-white" : "bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#5A5A40]/10"
                      )}
                    >
                      {t === 'text' ? '文本' : t === 'link' ? '链接' : '图片'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest mb-2 block">内容 / URL</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full h-32 bg-[#f5f5f0] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 ring-[#5A5A40]/20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl font-medium text-[#5A5A40] hover:bg-[#f5f5f0] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 bg-[#5A5A40] text-white rounded-xl font-medium hover:bg-[#4a4a35] transition-colors"
              >
                保存素材
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
