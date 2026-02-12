import path from 'path';
import { promises as fs } from 'fs';
import {
    type TaskEntity,
    type TaskStatus,
    type TaskPriority,
    slugify,
    createEntityMeta,
    ensureEntityDir,
    findEntityByTitle,
    listEntities,
    writeEntity,
} from '../entities/entity.js';
import { getActiveProject } from '../state/manager.js';
import { registerServiceTool, type ServiceToolResult } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// TASKS.ADD - Create a new task
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'tasks.add',
    description: 'Create a new task in the current project',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Task title', required: true },
            content: { type: 'string', description: 'Task description' },
            priority: { type: 'string', description: 'Priority: low, medium, high, critical' },
            dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
            tags: { type: 'array', description: 'Tags' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content = '', priority = 'medium', dueDate, tags = [] } = input as {
            title: string;
            content?: string;
            priority?: TaskPriority;
            dueDate?: string;
            tags?: string[];
        };

        context.log.info(`Creating task: ${title}`);

        const project = await getActiveProject();
        if (!project) {
            return { success: false, output: null, error: 'No active project' };
        }

        const existing = await findEntityByTitle('task', title);
        if (existing) {
            context.log.warn(`Task already exists: ${title}`);
            return { success: false, output: null, error: `Task "${title}" already exists` };
        }

        const todosDir = await ensureEntityDir('task');
        const slug = slugify(title);
        const filepath = path.join(todosDir, `${slug}.md`);

        const meta: TaskEntity = {
            ...createEntityMeta('task', title, { tags, project }),
            entityType: 'task',
            status: 'open',
            priority,
            dueDate,
        };

        await writeEntity(filepath, { ...meta }, content);

        context.log.info(`Task created: ${filepath}`);

        return {
            success: true,
            output: { filepath, title, content, priority, dueDate, status: 'open' },
            canvasUpdate: {
                type: 'todo',
                title,
                content,
                metadata: { priority, dueDate, status: 'open' },
                dirty: false,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS.UPDATE - Update a task
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'tasks.update',
    description: 'Update an existing task',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Task title to update', required: true },
            content: { type: 'string', description: 'New description' },
            status: { type: 'string', description: 'Status: open, in-progress, done, blocked' },
            priority: { type: 'string', description: 'Priority: low, medium, high, critical' },
            dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
            tags: { type: 'array', description: 'Replace tags' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content, status, priority, dueDate, tags } = input as {
            title: string;
            content?: string;
            status?: TaskStatus;
            priority?: TaskPriority;
            dueDate?: string;
            tags?: string[];
        };

        context.log.info(`Updating task: ${title}`);

        const found = await findEntityByTitle('task', title);
        if (!found) {
            context.log.error(`Task not found: ${title}`);
            return { success: false, output: null, error: `Task "${title}" not found` };
        }

        const newContent = content !== undefined ? content : found.content;

        if (status !== undefined) found.meta.status = status;
        if (priority !== undefined) found.meta.priority = priority;
        if (dueDate !== undefined) found.meta.dueDate = dueDate;
        if (tags) found.meta.tags = tags;

        await writeEntity(found.filepath, found.meta, newContent);

        context.log.info(`Task updated: ${found.filepath}`);

        return {
            success: true,
            output: {
                filepath: found.filepath,
                title: found.meta.title,
                content: newContent,
                status: found.meta.status,
                priority: found.meta.priority,
                dueDate: found.meta.dueDate,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS.REMOVE - Delete a task
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'tasks.remove',
    description: 'Delete a task',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Task title to delete', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Removing task: ${title}`);

        const found = await findEntityByTitle('task', title);
        if (!found) {
            context.log.error(`Task not found: ${title}`);
            return { success: false, output: null, error: `Task "${title}" not found` };
        }

        await fs.unlink(found.filepath);

        context.log.info(`Task removed: ${found.filepath}`);

        return {
            success: true,
            output: { filepath: found.filepath, title: found.meta.title, deleted: true },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS.REVIEW - Review a task with AI
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'tasks.review',
    description: 'Review a task with AI to break it down or clarify',
    type: 'ai',
    capability: 'reason',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Task title to review', required: true },
            action: { type: 'string', description: 'Action: breakdown, clarify, estimate' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, action = 'breakdown' } = input as { title: string; action?: string };

        context.log.info(`Reviewing task: ${title} (${action})`);

        const found = await findEntityByTitle('task', title);
        if (!found) {
            context.log.error(`Task not found: ${title}`);
            return { success: false, output: null, error: `Task "${title}" not found` };
        }

        const fullContext = await context.ctx.getFullContext('todos');

        let prompt: string;
        switch (action) {
            case 'clarify':
                prompt = `Please analyze this task and ask clarifying questions to ensure it's well-defined.

Task: ${found.meta.title}
Description: ${found.content}
Priority: ${found.meta.priority}
Status: ${found.meta.status}
${found.meta.dueDate ? `Due: ${found.meta.dueDate}` : ''}

What questions should we answer to make this task clearer?`;
                break;
            case 'estimate':
                prompt = `Please estimate the time and effort needed for this task.

Task: ${found.meta.title}
Description: ${found.content}
Priority: ${found.meta.priority}

Provide an estimate with assumptions.`;
                break;
            case 'breakdown':
            default:
                prompt = `Please break down this task into smaller, actionable subtasks.

Task: ${found.meta.title}
Description: ${found.content}
Priority: ${found.meta.priority}

Provide a numbered list of subtasks.`;
        }

        const review = await context.llm.chat([
            { role: 'system', content: fullContext.combined },
            { role: 'user', content: prompt },
        ]);

        context.log.info('Review completed');

        return {
            success: true,
            output: { title: found.meta.title, content: found.content, action, review },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS.LIST - List all tasks
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'tasks.list',
    description: 'List all tasks in the current project',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            includeCompleted: { type: 'boolean', description: 'Include done tasks' },
        },
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { includeCompleted = false } = input as { includeCompleted?: boolean };

        context.log.info('Listing tasks');

        const entities = await listEntities('task');

        const tasks = entities
            .filter(e => includeCompleted || e.meta.status !== 'done')
            .map(e => ({
                title: e.meta.title as string,
                filepath: e.filepath,
                status: e.meta.status as string,
                priority: e.meta.priority as string,
                dueDate: e.meta.dueDate as string | undefined,
                tags: (e.meta.tags as string[]) || [],
            }))
            .sort((a, b) => {
                const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
                if (pDiff !== 0) return pDiff;
                if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
                return a.dueDate ? -1 : b.dueDate ? 1 : 0;
            });

        return { success: true, output: { tasks } };
    },
});
