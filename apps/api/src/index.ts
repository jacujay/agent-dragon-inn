import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { agentRoutes } from './routes/agents.js'
import workflowRoutes from './routes/workflows.js'
import executionRoutes from './routes/executions.js'
import orgRoutes from './routes/organizations.js'
import { meRoutes } from './routes/me.js'
import { errorHandler } from './plugins/error-handler.js'
import { prismaPlugin } from './plugins/prisma.js'
import { clerkFastifyPlugin } from './plugins/clerk.js'

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>()

// Plugins
await server.register(cors, { origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000' })
await server.register(helmet)
await server.register(swagger, { openapi: { info: { title: 'Agent Dragon Inn API', version: '1.0.0' } } })
await server.register(swaggerUi, { routePrefix: '/docs' })
await server.register(prismaPlugin)

// Clerk auth plugin — must be registered before routes that use getAuth/requireAuth
await server.register(clerkFastifyPlugin)

await server.setErrorHandler(errorHandler)

// Routes
await server.register(meRoutes, { prefix: '/v1/me' })
await server.register(orgRoutes, { prefix: '/v1/organizations' })
await server.register(agentRoutes, { prefix: '/v1/organizations/:orgId/agents' })
await server.register(workflowRoutes, { prefix: '/v1/organizations/:orgId/workflows' })
await server.register(executionRoutes, { prefix: '/v1/organizations/:orgId' })

// Health check
server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Start
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })
    server.log.info('Agent Dragon Inn API running on http://localhost:3001')
    server.log.info('API docs available at http://localhost:3001/docs')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

export default server
