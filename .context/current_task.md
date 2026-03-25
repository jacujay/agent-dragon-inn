# 当前任务

## 进行中
- PR Review：等待人工合并 PR #1 和 PR #2

## 待处理（按优先级）

### 高优先级
- [ ] **人工合并 PR #1 + PR #2**（gh auth 无法自 approve）
- [ ] Clerk Auth 集成到 Fastify API（middleware + JWT 验证）
  - 需要配置 CLERK_SECRET_KEY 环境变量
  - 需要实现 org membership 校验中间件
- [ ] BullMQ worker 实现（执行引擎核心）

### 中优先级
- [ ] Neon 数据库创建 + DATABASE_URL 配置
- [ ] Vercel/Railway 部署配置
- [ ] Webhook outbound events（execution.completed 等）

### 待定
- [ ] Agent CRUD + OpenAI/Anthropic 适配器（M1.3）
- [ ] Workflow Builder UI（M1.4）
- [ ] Execution streaming UI（SSE）（M1.5）

---

## 阻塞项
1. ~~无远程仓库~~ ✅ 已解决（jacujay/agent-dragon-inn）
2. ~~gh 无法自 approve~~ - 需人工合并 PR
3. 无数据库 — Prisma schema ready，需要 Neon 配置
4. 无 Clerk 凭证 — API routes 有占位符，需配置 CLERK_SECRET_KEY

---

## GitHub 仓库
https://github.com/jacujay/agent-dragon-inn
