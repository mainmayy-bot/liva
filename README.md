# Liva

一个用于管理人生版图、生活事项、今日待办与时间轴的个人生活工作台。

## 本地运行

要求 Node.js 20+ 和 pnpm。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

没有配置 Supabase 时，应用仍会以本地模式正常运行。

## 接入 Supabase

1. 在 Supabase 创建项目。
2. 打开项目的 **SQL Editor**，执行 [`supabase/schema.sql`](supabase/schema.sql)。
3. 从 Supabase 项目设置复制 Project URL 和 Publishable Key。
4. 复制 `.env.example` 为 `.env.local`，填写：

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_LIVA_WORKSPACE_ID=一个仅自己使用的随机UUID
```

`VITE_LIVA_WORKSPACE_ID` 是云端空间标识。希望多台设备共享同一份数据时，各处必须使用同一个值。请使用随机 UUID，不要使用示例值。

应用启动时会读取 Supabase 中的版图、事项和待办；修改后约 700ms 自动同步。前端只使用 Supabase Publishable Key，不要把 `service_role` 密钥放进浏览器或 GitHub。

## 上传 GitHub

```bash
git init
git add .
git commit -m "Initial Liva release"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

`.env.local` 已被 `.gitignore` 排除，不会上传密钥。

## 生成公开链接并自动部署

推荐使用 Vercel：

1. 登录 Vercel，选择 **Add New → Project**。
2. 导入刚上传的 GitHub 仓库。
3. 在 Environment Variables 中添加上述三个 `VITE_` 变量。
4. 点击 Deploy。

Vercel 会识别 Vite 配置并生成公开网址。之后每次向 GitHub `main` 分支推送，线上版本都会自动更新；其他分支和 Pull Request 会生成独立预览链接。

## 构建

```bash
pnpm build
pnpm preview
```

生产文件输出到 `dist/`，该目录无需提交 GitHub。

## 数据安全

- 数据表已启用 Row Level Security。
- 浏览器请求通过随机 Workspace ID 访问对应快照。
- Publishable Key 可以用于前端；`service_role` 密钥绝不能进入前端代码。
- 若未来开放给多个用户，建议接入 Supabase Auth，并将 RLS 策略升级为按 `auth.uid()` 隔离。
