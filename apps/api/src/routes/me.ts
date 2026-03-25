import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'
import { requireSession } from '../plugins/auth.js'
import { getAuth } from '@clerk/fastify'
import type { AuthObject } from '@clerk/backend'

const meRoutes: FastifyPluginAsync = async (server) => {
  const sessionPreHandler = requireSession(server)

  server.get(
    '/',
    {
      preHandler: sessionPreHandler,
      schema: {
        description: 'Get current authenticated user profile',
        tags: ['auth'],
        response: {
          200: Type.Object({
            id: Type.String(),
            email: Type.String(),
            name: Type.String(),
            orgId: Type.Optional(Type.String()),
            orgSlug: Type.Optional(Type.String()),
            orgRole: Type.Optional(Type.String()),
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
      const auth = getAuth(request) as AuthObject

      // Clerk JWT claims contain userId, orgId, orgSlug, orgRole.
      // For full user profile (name, email), use clerkClient(server).users.getUser(userId).
      return reply.send({
        id: auth.userId,
        email: (auth.sessionClaims?.email as string | undefined) ?? '',
        name:
          (auth.sessionClaims?.name as string | undefined) ??
          (auth.sessionClaims?.primary_email_address_id as string | undefined) ??
          '',
        orgId: auth.orgId ?? undefined,
        orgSlug: auth.orgSlug ?? undefined,
        orgRole: auth.orgRole ?? undefined,
        memberships: auth.orgId
          ? [
              {
                organizationId: auth.orgId,
                organizationName: (auth.sessionClaims?.org_name as string | undefined) ?? auth.orgId,
                role: auth.orgRole ?? 'MEMBER',
              },
            ]
          : [],
      })
    }
  )
}

export { meRoutes }
export default meRoutes
