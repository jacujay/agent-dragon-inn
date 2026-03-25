import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const orgRoutes: FastifyPluginAsync = async (server) => {
  server.post(
    '/',
    {
      schema: {
        description: 'Create a new organization',
        tags: ['organizations'],
        body: Type.Object({
          name: Type.String({ minLength: 1, maxLength: 128 }),
          slug: Type.String({ minLength: 1, maxLength: 64, pattern: '^[a-z0-9-]+$' }),
        }),
        response: {
          201: Type.Object({
            id: Type.String(),
            name: Type.String(),
            slug: Type.String(),
            plan: Type.String(),
            createdAt: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, slug } = request.body as { name: string; slug: string }
      // TODO: Wire Clerk auth — use authenticated user as owner
      const org = await server.prisma.organization.create({
        data: { name, slug },
      })
      return reply.status(201).send(org)
    }
  )

  server.get(
    '/:orgId',
    {
      schema: {
        description: 'Get organization details',
        tags: ['organizations'],
        params: Type.Object({ orgId: Type.String() }),
        response: {
          200: Type.Object({
            id: Type.String(),
            name: Type.String(),
            slug: Type.String(),
            plan: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const org = await server.prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
      return reply.send(org)
    }
  )
}

export default orgRoutes
