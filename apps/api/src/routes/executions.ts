import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const executionRoutes: FastifyPluginAsync = async (server) => {
  // POST /v1/organizations/:orgId/workflows/:workflowId/executions
  server.post(
    '/workflows/:workflowId/executions',
    {
      schema: {
        description: 'Trigger a workflow execution',
        tags: ['executions'],
        params: Type.Object({ orgId: Type.String(), workflowId: Type.String() }),
        body: Type.Object({
          variables: Type.Optional(Type.Record(Type.String(), Type.String())),
        }),
      },
    },
    async (request, reply) => {
      const { orgId, workflowId } = request.params as { orgId: string; workflowId: string }
      const { variables } = request.body as { variables?: Record<string, string> }

      const execution = await server.prisma.execution.create({
        data: {
          organizationId: orgId,
          workflowId,
          triggeredById: 'user_placeholder',
          triggerType: 'MANUAL',
          status: 'QUEUED',
        },
      })

      // TODO: Enqueue to BullMQ worker
      // await executionQueue.add('run', { executionId: execution.id, variables })

      return reply.status(202).send({
        executionId: execution.id,
        status: execution.status,
        createdAt: execution.createdAt.toISOString(),
      })
    }
  )

  // GET /v1/organizations/:orgId/executions
  server.get(
    '/executions',
    {
      schema: {
        description: 'List executions',
        tags: ['executions'],
        params: Type.Object({ orgId: Type.String() }),
        querystring: Type.Object({
          workflowId: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
          page: Type.Optional(Type.Integer({ minimum: 1 })),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        }),
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const { workflowId, status, page = 1, limit = 50 } = request.query as {
        workflowId?: string; status?: string; page?: number; limit?: number
      }
      const where = {
        organizationId: orgId,
        ...(workflowId && { workflowId }),
        ...(status && { status: status as 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' }),
      }
      const [data, total] = await Promise.all([
        server.prisma.execution.findMany({
          where,
          include: { workflow: { select: { name: true } }, triggeredBy: { select: { name: true, email: true } } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        server.prisma.execution.count({ where }),
      ])
      return reply.send({ data, total, page, limit })
    }
  )

  // GET /v1/organizations/:orgId/executions/:executionId
  server.get(
    '/executions/:executionId',
    {
      schema: {
        description: 'Get execution detail',
        tags: ['executions'],
        params: Type.Object({ orgId: Type.String(), executionId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { orgId, executionId } = request.params as { orgId: string; executionId: string }
      const execution = await server.prisma.execution.findFirstOrThrow({
        where: { id: executionId, organizationId: orgId },
        include: {
          steps: { orderBy: { order: 'asc' }, include: { workflowStep: { include: { agent: true } } } },
          workflow: true,
        },
      })
      return reply.send(execution)
    }
  )
}

export default executionRoutes
