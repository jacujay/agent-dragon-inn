import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const agentRoutes: FastifyPluginAsync = async (server) => {
  server.post(
    '/',
    {
      schema: {
        description: 'Create a new agent',
        tags: ['agents'],
        params: Type.Object({ orgId: Type.String() }),
        body: Type.Object({
          name: Type.String({ minLength: 1, maxLength: 128 }),
          description: Type.Optional(Type.String()),
          modelProvider: Type.String(),
          modelName: Type.String(),
          systemPrompt: Type.Optional(Type.String()),
          temperature: Type.Optional(Type.Number({ minimum: 0, maximum: 2 })),
          maxTokens: Type.Optional(Type.Integer({ minimum: 1 })),
        }),
        response: {
          201: Type.Object({
            id: Type.String(),
            name: Type.String(),
            modelProvider: Type.String(),
            modelName: Type.String(),
            createdAt: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const data = request.body as Record<string, unknown>
      // TODO: Enforce orgId membership check from Clerk JWT
      const agent = await server.prisma.agent.create({
        data: {
          organizationId: orgId,
          createdById: 'user_placeholder', // TODO: from Clerk JWT
          name: data.name as string,
          description: data.description as string | null,
          modelProvider: (data.modelProvider as string).toUpperCase(),
          modelName: data.modelName as string,
          systemPrompt: data.systemPrompt as string | null,
          temperature: (data.temperature as number) ?? 0.7,
          maxTokens: data.maxTokens as number | null,
        },
      })
      return reply.status(201).send(agent)
    }
  )

  server.get(
    '/',
    {
      schema: {
        description: 'List agents in organization',
        tags: ['agents'],
        params: Type.Object({ orgId: Type.String() }),
        querystring: Type.Object({
          isActive: Type.Optional(Type.Boolean()),
          page: Type.Optional(Type.Integer({ minimum: 1 })),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        }),
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const { isActive, page = 1, limit = 50 } = request.query as {
        isActive?: boolean; page?: number; limit?: number
      }
      const where = { organizationId: orgId, ...(isActive !== undefined && { isActive }) }
      const [agents, total] = await Promise.all([
        server.prisma.agent.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
        server.prisma.agent.count({ where }),
      ])
      return reply.send({ data: agents, total, page, limit })
    }
  )

  server.get(
    '/:agentId',
    {
      schema: {
        description: 'Get agent by ID',
        tags: ['agents'],
        params: Type.Object({ orgId: Type.String(), agentId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { orgId, agentId } = request.params as { orgId: string; agentId: string }
      const agent = await server.prisma.agent.findFirstOrThrow({
        where: { id: agentId, organizationId: orgId },
        include: { variables: true },
      })
      return reply.send(agent)
    }
  )

  server.patch(
    '/:agentId',
    {
      schema: {
        description: 'Update agent',
        tags: ['agents'],
        params: Type.Object({ orgId: Type.String(), agentId: Type.String() }),
        body: Type.Object({
          name: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
          systemPrompt: Type.Optional(Type.String()),
          temperature: Type.Optional(Type.Number()),
          maxTokens: Type.Optional(Type.Integer()),
          isActive: Type.Optional(Type.Boolean()),
        }),
      },
    },
    async (request, reply) => {
      const { orgId, agentId } = request.params as { orgId: string; agentId: string }
      const data = request.body as Record<string, unknown>
      const agent = await server.prisma.agent.updateMany({
        where: { id: agentId, organizationId: orgId },
        data,
      })
      if (agent.count === 0) return reply.status(404).send({ error: 'Not found' })
      const updated = await server.prisma.agent.findUniqueOrThrow({ where: { id: agentId } })
      return reply.send(updated)
    }
  )

  server.delete(
    '/:agentId',
    {
      schema: {
        description: 'Soft-delete agent',
        tags: ['agents'],
        params: Type.Object({ orgId: Type.String(), agentId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { orgId, agentId } = request.params as { orgId: string; agentId: string }
      await server.prisma.agent.updateMany({
        where: { id: agentId, organizationId: orgId },
        data: { isActive: false },
      })
      return reply.status(204).send()
    }
  )
}

export default agentRoutes
