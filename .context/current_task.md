# 当前任务

## 进行中
暂无

## 待处理（按优先级）

### 高优先级
- [ ] 配置 git remote 并创建 PR（需要远程仓库 URL）
- [ ] Clerk Auth 集成到 Fastify API（middleware + JWT 验证）
- [ ] BullMQ worker 实现（执行引擎核心）

### 中优先级
- [ ] Vercel/Railway 部署配置
- [ ] 数据库创建（Neon 或 Supabase）
- [ ] Webhook outbound events（execution.completed 等）

### 待定
- [ ] Agent CRUD + OpenAI/Anthropic 适配器（M1.3）
- [ ] Workflow Builder UI（M1.4）
- [ ] Execution streaming UI（SSE）（M1.5）

---

## 阻塞项
1. **无远程仓库** — 无法创建 PR，需先提供 git remote URL
2. **无数据库** — Prisma schema ready but no DB URL configured
3. **无 Clerk 凭证** — API routes 有占位符，需配置 CLERK_SECRET_KEY
