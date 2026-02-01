import { z } from 'zod';

// Frontmatter schema for markdown files
export const FrontmatterSchema = z.object({
    title: z.string(),
    created: z.string(),
    modified: z.string().optional(),
    project: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['active', 'done', 'blocked', 'archived']).optional(),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

// Provider secrets
export const ProviderSecretSchema = z.object({
    apiKey: z.string(),
});

export const SecretsSchema = z.object({
    providers: z.record(z.string(), ProviderSecretSchema),
});

export type Secrets = z.infer<typeof SecretsSchema>;

// Task-to-model mapping
export const TaskModelMappingSchema = z.object({
    provider: z.string(),
    model: z.string(),
});

export type TaskModelMapping = z.infer<typeof TaskModelMappingSchema>;

// Config
export const ConfigSchema = z.object({
    taskModelMapping: z.record(z.string(), TaskModelMappingSchema),
    defaultProvider: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

// State
export const StateSchema = z.object({
    activeProject: z.string().nullable(),
    lastUsed: z.string().optional(),
});

export type State = z.infer<typeof StateSchema>;

// Tool types
export const ToolTypeSchema = z.enum(['deterministic', 'ai']);

export const ToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    type: ToolTypeSchema,
    model: z.string().optional(),
});

export type ToolDefinition = z.infer<typeof ToolSchema>;

// Standard tags
export const StandardTags = [
    'todo',
    'note',
    'research',
    'meeting',
    'idea',
    'blocked',
    'done',
    'context',
] as const;

export type StandardTag = typeof StandardTags[number];
