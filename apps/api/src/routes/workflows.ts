import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const workflowRoutes: FastifyPluginAsync = async (server) => {
  server.post(
    '/',
    {
      schema: {
        description: 'Create a new workflow',
        tags: ['workflows'],
        params: Type.Object({ orgId: Type.String() }),
        body: Type.Object({
          name: Type.String({ minLength: 1, maxLength: 128 }),
          description: Type.Optional(Type.String()),
          triggerType: Type.Optional(Type.String()),
          triggerConfig: Type.Optional(Type.Object({}, { additionalProperties: true })),
          steps: Type.Optional(
            Type.Array(
              Type.Object({
                agentId: Type.String(),
                name: Type.String(),
                order: Type.Integer(),
                inputMapping: Type.Optional(Type.Object({}, { additionalProperties: true })),
                timeoutSeconds: Type.Optional(Type.Integer()),
              })
            )
          ),
        }),
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const { name, description, triggerType, triggerConfig, steps } = request.body as {
        name: string; description?: string; triggerType?: string; triggerConfig?: object; steps?: object[]
      }

      const workflow = await server.prisma.workflow.create({
        data: {
          organizationId: orgId,
          createdById: 'user_placeholder',
          name,
          description,
          triggerType: (triggerType as 'MANUAL' | 'WEBHOOK' | 'SCHEDULE' | 'API') ?? 'MANUAL',
          triggerConfig: triggerConfig ?? {},
          steps: steps
            ? {
                create: (steps as Array<{ agentId: string; name: string; order: number; inputMapping?: object; timeoutSeconds?: number }>).map((s) => ({
                  agentId: s.agentId,
                  name: s.name,
                  order: s.order,
                  inputMapping: s.inputMapping ?? {},
                  timeoutSeconds: s.timeoutSeconds ?? 120,
                })),
              }
            : undefined,
        },
        include: { steps: { orderBy: { order: 'asc' } } },
      })

      return reply.status(201).send(workflow)
    }
  )

  server.get(
    '/',
    {
      schema: {
        description: 'List workflows',
        tags: ['workflows'],
        params: Type.Object({ orgId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const workflows = await server.prisma.workflow.findMany({
        where: { organizationId: orgId },
        include: { steps: { orderBy: { order: 'asc' }, include: { agent: { select: { name: true, modelName: true } } } } },
        orderBy: { createdAt: 'desc' },
      })
      return reply.send({ data: workflows })
    }
  )

  server.get(
    '/:workflowId',
    {
      schema: {
        description: 'Get workflow detail',
        tags: ['workflows'],
        params: Type.Object({ orgId: Type.String(), workflowId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { orgId, workflowId } = request.params as { orgId: string; workflowId: string }
      const workflow = await server.prisma.workflow.findFirstOrThrow({
        where: { id: workflowId, organizationId: orgId },
        include: { steps: { orderBy: { order: 'asc' }, include: { agent: true } } },
      })
      return reply.send(workflow)
    }
  )
}

export default workflowRoutes
