import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export const prismaPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  await prisma.$connect()
  server.log.info('Database connected')

  server.decorate('prisma', prisma)

  server.addHook('onClose', async () => {
    await prisma.$disconnect()
    server.log.info('Database disconnected')
  })
}
