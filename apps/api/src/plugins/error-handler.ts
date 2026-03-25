import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error)

  // Zod validation errors
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: error.validation,
    })
  }

  // Prisma unique constraint
  if (error.code === 'P2002') {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: 'A record with this value already exists',
    })
  }

  // Default 500
  const statusCode = error.statusCode ?? 500
  reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Internal Server Error',
    message: statusCode < 500 ? error.message : 'An unexpected error occurred',
  })
}
