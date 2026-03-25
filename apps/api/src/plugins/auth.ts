import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { getAuth } from '@clerk/fastify'

/**
 * Authenticated request context set by requireAuth preHandler.
 */
export interface AuthenticatedRequest {
  clerkUserId: string
  clerkOrgId: string | undefined
  clerkOrgSlug: string | undefined
  clerkOrgRole: string | undefined
}

declare module 'fastify' {
  interface FastifyRequest {
    clerkUserId: string
    clerkOrgId: string | undefined
    clerkOrgSlug: string | undefined
    clerkOrgRole: string | undefined
  }
}

/**
 * Creates a Fastify preHandler hook that enforces:
 * 1. Valid Clerk JWT (authenticated user)
 * 2. Membership in the organization specified by :orgId param
 *
 * Sets request.clerkUserId, request.clerkOrgId, request.clerkOrgSlug, request.clerkOrgRole
 * on the request object for use in route handlers.
 *
 * @param server - FastifyInstance with clerkPlugin already registered
 * @returns Fastify preHandler hook
 */
export function requireAuth(server: FastifyInstance) {
  return async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
    const auth = getAuth(request)

    if (!auth.userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid Clerk session token',
      })
    }

    // Extract orgId from route params (:orgId)
    const { orgId: paramOrgId } = request.params as { orgId?: string }

    if (paramOrgId) {
      // If the route has an :orgId param, enforce org membership
      // The user must either be a member of the org in the param,
      // OR the param orgId must match their active orgId from the JWT.
      // Clerk allows multiple org memberships; we use the JWT's orgId (active org).
      const userOrgId = auth.orgId ?? undefined
      const userOrgSlug = auth.orgSlug ?? undefined
      const userOrgRole = auth.orgRole ?? undefined

      // Allow access if:
      // - The JWT's orgId matches the param orgId, OR
      // - The JWT's orgSlug matches the param orgId (slug-based lookup)
      // If the user has no org membership but the route requires one, deny.
      if (!userOrgId && !userOrgSlug) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Organization membership required. Please join an organization.',
        })
      }

      const orgMatches =
        userOrgId === paramOrgId || userOrgSlug === paramOrgId

      if (!orgMatches) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: `You do not have access to organization '${paramOrgId}'`,
        })
      }

      // Attach auth context to request
      request.clerkUserId = auth.userId
      request.clerkOrgId = userOrgId
      request.clerkOrgSlug = userOrgSlug
      request.clerkOrgRole = userOrgRole ?? undefined
    } else {
      // No orgId in route params — just set user info
      request.clerkUserId = auth.userId
      request.clerkOrgId = auth.orgId ?? undefined
      request.clerkOrgSlug = auth.orgSlug ?? undefined
      request.clerkOrgRole = auth.orgRole ?? undefined
    }
  }
}

/**
 * Minimal auth check — just requires a valid Clerk session.
 * Does NOT enforce organization membership.
 */
export function requireSession(server: FastifyInstance) {
  return async function sessionPreHandler(request: FastifyRequest, reply: FastifyReply) {
    const auth = getAuth(request)
    if (!auth.userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid Clerk session token',
      })
    }
    request.clerkUserId = auth.userId
    request.clerkOrgId = auth.orgId ?? undefined
    request.clerkOrgSlug = auth.orgSlug ?? undefined
    request.clerkOrgRole = auth.orgRole ?? undefined
  }
}
