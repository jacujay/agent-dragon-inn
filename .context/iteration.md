# 迭代记录

## v0.1 - 2026-03-25
- 项目初始化
- 创建 CEO Cron 运营机制
- Git PR 流程规范确立

## v0.2 - 2026-03-25 07:40
- 完成 SPEC.md（CEO级产品规格，含10大功能、8用户故事、5 KPI、竞品分析）
- 完成 TECH_STACK.md（完整技术架构：Node/Fastify/Prisma/Clerk，9表ERD，10 API端点，3阶段路线图）
- Commit: 252a09e

## v0.3 - 2026-03-25 08:00
- 完成项目脚手架（M1.1）— commit: 42c8cb2
  - Monorepo 结构（apps/web, apps/api, packages/shared）
  - Next.js 15 + Tailwind CSS v4 前端（shadcn/ui 主题）
  - Fastify API（5个路由模块：me, orgs, agents, workflows, executions）
  - Prisma Schema（10张表：User, Organization, Agent, Workflow, Execution等）
  - Shared package（Zod schemas + API response helpers）
  - GitHub Actions CI + Vercel preview deploy

## v0.4 - 2026-03-25 08:32
- 初始化 GitHub 仓库（jacujay/agent-dragon-inn）
- 创建 PR #1：SPEC.md + TECH_STACK.md → master
- 创建 PR #2：M1.1 脚手架 → master
- **注意：** PR 由 jacujay 账号创建，gh CLI 无法自 approve（需人工 Review + Merge）
- **关键里程碑：** 项目从纯本地开发进入 GitHub 协作阶段

## 待办
- [x] 配置远程仓库（git remote）并创建 PR ✅ 2026-03-25
- [ ] Clerk Auth 集成（org membership + JWT验证）
- [ ] BullMQ 执行引擎 worker
- [ ] 数据库部署配置（Neon）
- [ ] MVP 功能优先级排序（Agent CRUD vs Workflow Editor）

---

## PR 状态

| PR | 标题 | 状态 | 链接 |
|----|------|------|------|
| #1 | SPEC.md + TECH_STACK.md | OPEN（待人工合并） | https://github.com/jacujay/agent-dragon-inn/pull/1 |
| #2 | M1.1 项目脚手架 | OPEN（待人工合并） | https://github.com/jacujay/agent-dragon-inn/pull/2 |

## 分支状态
| 分支 | 内容 | 状态 |
|------|------|------|
| master | 基础分支 | |
| feat/spec-draft-20260325 | SPEC.md + TECH_STACK.md | PR #1 |
| feat/scaffold-20260325 | Monorepo 脚手架 | PR #2 |
