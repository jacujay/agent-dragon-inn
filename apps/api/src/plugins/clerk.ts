import { clerkPlugin } from '@clerk/fastify'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { getAuth } from '@clerk/fastify'
import type { AuthObject } from '@clerk/backend'

declare module '@clerk/fastify' {
  interface ClerkRequest {
    auth: AuthObject
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by clerkPlugin after JWT verification — contains userId, orgId, orgSlug, etc. */
    auth: AuthObject
  }
  interface FastifyInstance {
    /** Expose getAuth for use in route handlers */
    getAuth: typeof getAuth
  }
}

export const clerkFastifyPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Register the Clerk plugin with Fastify.
  // This adds `request.auth` with userId, orgId, orgSlug etc. after JWT verification.
  // Uses preHandler hook by default (configurable via hookName option).
  await server.register(clerkPlugin)

  // Decorate server with getAuth for convenience in route handlers
  server.decorate('getAuth', getAuth)

  server.log.info('Clerk auth plugin registered')
}

export { getAuth }
