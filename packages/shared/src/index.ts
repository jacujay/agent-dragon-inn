import { z } from 'zod'

// Re-export all shared types and schemas

// Model providers
export const ModelProviderSchema = z.enum(['OPENAI', 'ANTHROPIC', 'AZURE', 'GOOGLE', 'CUSTOM'])
export type ModelProvider = z.infer<typeof ModelProviderSchema>

// Org roles
export const OrgRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
export type OrgRole = z.infer<typeof OrgRoleSchema>

// Trigger types
export const TriggerTypeSchema = z.enum(['MANUAL', 'WEBHOOK', 'SCHEDULE', 'API'])
export type TriggerType = z.infer<typeof TriggerTypeSchema>

// Execution status
export const ExecutionStatusSchema = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>

// Step status
export const StepStatusSchema = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'])
export type StepStatus = z.infer<typeof StepStatusSchema>

// Plan types
export const PlanSchema = z.enum(['FREE', 'PRO', 'ENTERPRISE'])
export type Plan = z.infer<typeof PlanSchema>

// API response wrappers
export function ok<T>(data: T) {
  return { ok: true, data }
}

export function err(message: string, code = 'INTERNAL_ERROR') {
  return { ok: false, error: { code, message } }
}

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})
export type Pagination = z.infer<typeof PaginationSchema>
