<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# CreativeHub · 灵感创作中心

**一站式 AI 内容创作平台，专为微信公众号 & 小红书创作者打造**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![Turso](https://img.shields.io/badge/Turso-libSQL-4.1A75F9?logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)

</div>

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **AI 创意灵感** | 输入主题，AI 自动生成标题、大纲、素材参考及平台风格建议 |
| **Markdown 编辑器** | 左右分栏，实时预览，支持 Mermaid 流程图 & ECharts 图表渲染 |
| **内容库管理** | 文章草稿管理，一键适配发布到公众号或小红书 |
| **AI 内容适配** | 同一篇文章自动生成适合微信公众号（专业深度）和小红书（活泼简洁）的不同版本 |
| **发布历史** | 所有发布版本持久化存储，随时查看/复制全文 |
| **素材管理** | 收藏文本、链接、图片等素材，便于创作时引用 |
| **多存储支持** | 支持 SQLite（本地）和 Turso（Vercel 部署），通过环境变量配置 |

---

## 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Next.js App Router                  │  │
│  │                                                      │  │
│  │  app/page.tsx  ── 主应用页面 (单页面，5个视图)         │  │
│  │    ├── InspirationView   创意灵感                     │  │
│  │    ├── EditorView        Markdown 编辑器 + 实时预览   │  │
│  │    ├── LibraryView       内容库 + AI适配发布          │  │
│  │    ├── PublicationsView  发布管理                     │  │
│  │    └── MaterialsView     素材管理                     │  │
│  │                                                      │  │
│  │  app/layout.tsx  ── 全局布局 (字体: Inter/Cormorant) │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  src/db.ts   │  │  src/services│  │  src/types   │      │
│  │  src/auth.ts │  │ /aiService   │  │    .ts       │      │
│  │ SQLite+JWT   │  │  .ts         │  │ Article      │      │
│  │ (better-     │  │ (HTTP Client)│  │ Material     │      │
│  │  sqlite3)    │  └──────┬───────┘  │ Inspiration  │      │
│  └──────┬───────┘        │          │ Publication  │      │
│         │                │          └──────────────┘      │
└─────────┼────────────────┼─────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (app/api/)                   │
│  /api/articles    /api/materials   /api/inspirations         │
│  /api/publications  /api/auth (login|logout|me)  /api/ai     │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────┐  ┌─────────────────────────────────────┐
│   SQLite     │  │     app/api/ai/route.ts              │
│  (data.db)   │  │   POST /api/ai                       │
│              │  │   ├── action: 'inspiration'          │
│  articles    │  │   └── action: 'adapt'               │
│  materials   │  └──────────────┬──────────────────────┘
│  inspirations│                 ▼
│  publications│  ┌─────────────────────────────────────┐
└──────────────┘  │     OpenAI Compatible API            │
                  │  OPENAI_BASE_URL (默认: openai.com)   │
                  │  支持: OpenAI / DeepSeek / 通义千问   │
                  │        Azure OpenAI / 其他兼容服务    │
                  └─────────────────────────────────────┘
```

### 目录结构

```
creative-hub/
├── app/
│   ├── api/
│   │   ├── ai/route.ts         # AI 接口代理（服务端，保护 API Key）
│   │   ├── articles/           # 文章 CRUD
│   │   ├── materials/          # 素材 CRUD
│   │   ├── inspirations/       # 灵感记录
│   │   ├── publications/       # 发布记录
│   │   └── auth/               # 登录、登出、当前用户
│   ├── globals.css             # 全局样式 & Tailwind 配置
│   ├── layout.tsx              # 根布局（字体加载、HTML 结构）
│   └── page.tsx                # 主应用（所有视图组件）
├── src/
│   ├── db.ts                   # SQLite 数据库（better-sqlite3）
│   ├── auth.ts                 # JWT 认证（jose）
│   ├── services/
│   │   └── aiService.ts        # AI 服务客户端（调用 /api/ai）
│   └── types.ts                # TypeScript 类型定义
├── .env.example                # 环境变量示例
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## 快速开始

### 前置要求

- Node.js 18+
- OpenAI 兼容 API Key

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

```env
# OpenAI 兼容接口（必填）
OPENAI_API_KEY="your_api_key_here"

# API 地址（可选，默认 OpenAI 官方）
OPENAI_BASE_URL="https://api.openai.com/v1"

# 使用的模型（可选，默认 gpt-4o-mini）
OPENAI_MODEL="gpt-4o-mini"

# 数据库配置（可选，默认为 SQLite）
DB_PROVIDER="sqlite"  # 或 "turso"

# SQLite 配置（当 DB_PROVIDER=sqlite 时）
SQLITE_PATH="./data.db"

# Turso 配置（当 DB_PROVIDER=turso 时）
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# 访问密码（必填）
ADMIN_PASSWORD="your_password_here"

# JWT 签名密钥（必填，生产环境请设置为随机强密钥）
JWT_SECRET="your_jwt_secret_here"
```

#### 数据库 Provider

| Provider | 说明 | 适用场景 |
|----------|------|----------|
| `sqlite`（默认） | 本地 SQLite 文件 | 本地开发 |
| `turso` | Turso (libSQL) 云数据库 | Vercel 部署 |

**Turso 配置步骤：**
1. 注册 [Turso](https://turso.tech/) 并创建数据库
2. 获取 `DATABASE_URL` 和 `AUTH_TOKEN`
3. 设置环境变量：`DB_PROVIDER=turso`

#### 支持的 AI 服务商

| 服务商 | `OPENAI_BASE_URL` |
|--------|-------------------|
| OpenAI（默认） | `https://api.openai.com/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Azure OpenAI | `https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT` |
| 其他兼容服务 | 参考对应文档 |

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| 语言 | TypeScript 5.7 |
| 数据库 | SQLite / Turso (通过 DB_PROVIDER 配置) |
| 认证 | JWT（jose）+ 密码登录 |
| AI 接口 | OpenAI 兼容 API（服务端代理） |
| 图表 | ECharts + Mermaid.js |
| Markdown | react-markdown + remark-gfm |
| 图标 | lucide-react |
| 动画 | motion |

---

## 构建部署

```bash
# 生产构建
npm run build

# 启动生产服务器
npm start
```

项目配置了 `output: 'standalone'`，支持容器化部署（Docker / Cloud Run）。

---

## 数据模型

```typescript
// 文章
Article { id, title, content, status, platforms, tags, createdAt, updatedAt }

// 素材
Material { id, title, type: 'link'|'text'|'image', content, createdAt }

// 灵感记录
Inspiration { id, query, results, createdAt }

// 发布版本
Publication { id, articleId, platform: 'wechat'|'xiaohongshu', title, content, createdAt }
```
