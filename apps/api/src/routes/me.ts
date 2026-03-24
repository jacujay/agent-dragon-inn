import { Type, Static } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const meRoutes: FastifyPluginAsync = async (server) => {
  server.get(
    '/',
    {
      schema: {
        description: 'Get current authenticated user profile',
        tags: ['auth'],
        response: {
          200: Type.Object({
            id: Type.String(),
            email: Type.String(),
            name: Type.String(),
            memberships: Type.Array(
              Type.Object({
                organizationId: Type.String(),
                organizationName: Type.String(),
                role: Type.String(),
              })
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      // TODO: Wire Clerk auth — extract user from JWT
      // For now return mock data until Clerk is configured
      return reply.send({
        id: 'user_placeholder',
        email: 'founder@agentdragoninn.com',
        name: 'Dragon Inn Founder',
        memberships: [
          {
            organizationId: 'org_placeholder',
            organizationName: 'Agent Dragon Inn',
            role: 'OWNER',
          },
        ],
      })
    }
  )
}

export default meRoutes
