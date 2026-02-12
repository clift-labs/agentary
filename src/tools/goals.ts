import path from 'path';
import { promises as fs } from 'fs';
import {
    type GoalEntity,
    type GoalStatus,
    type GoalPriority,
    type SmartFields,
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
// GOALS.ADD
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'goals.add',
    description: 'Create a new goal',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Goal title', required: true },
            content: { type: 'string', description: 'Goal description and details' },
            priority: { type: 'string', description: 'Priority: low, medium, high' },
            tags: { type: 'array', description: 'Tags' },
            smart: {
                type: 'object',
                description: 'SMART goal fields',
                properties: {
                    specific: { type: 'string', description: 'What exactly will you accomplish?' },
                    measurable: { type: 'string', description: 'How will you measure success?' },
                    achievable: { type: 'string', description: 'Is this realistic?' },
                    relevant: { type: 'string', description: 'Why does this matter?' },
                    timeBound: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
                },
            },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content = '', priority = 'medium', tags = [], smart = {} } = input as {
            title: string; content?: string; priority?: GoalPriority;
            tags?: string[]; smart?: Partial<SmartFields>;
        };

        context.log.info(`Creating goal: ${title}`);

        const project = await getActiveProject();
        if (!project) {
            return { success: false, output: null, error: 'No active project' };
        }

        const existing = await findEntityByTitle('goal', title);
        if (existing) {
            context.log.warn(`Goal already exists: ${title}`);
            return { success: false, output: null, error: `Goal "${title}" already exists` };
        }

        const goalsDir = await ensureEntityDir('goal');
        const slug = slugify(title);
        const filepath = path.join(goalsDir, `${slug}.md`);

        const meta: GoalEntity = {
            ...createEntityMeta('goal', title, { tags, project }),
            entityType: 'goal',
            status: 'active',
            priority,
            smart,
            milestones: [],
        };

        await writeEntity(filepath, { ...meta }, content);

        context.log.info(`Goal created: ${filepath}`);

        return {
            success: true,
            output: { filepath, title, content, priority, smart, status: 'active' },
            canvasUpdate: {
                type: 'goal',
                title,
                content,
                metadata: { priority, smart, status: 'active' },
                dirty: false,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// GOALS.UPDATE
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'goals.update',
    description: 'Update an existing goal',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Goal title to update', required: true },
            content: { type: 'string', description: 'New content' },
            status: { type: 'string', description: 'Status: active, completed, paused, abandoned' },
            priority: { type: 'string', description: 'Priority: low, medium, high' },
            smart: { type: 'object', description: 'Update SMART fields (merged with existing)' },
            addMilestone: { type: 'string', description: 'Add a milestone' },
            tags: { type: 'array', description: 'Replace tags' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content, status, priority, smart, addMilestone, tags } = input as {
            title: string; content?: string; status?: GoalStatus;
            priority?: GoalPriority; smart?: Partial<SmartFields>;
            addMilestone?: string; tags?: string[];
        };

        context.log.info(`Updating goal: ${title}`);

        const found = await findEntityByTitle('goal', title);
        if (!found) {
            context.log.error(`Goal not found: ${title}`);
            return { success: false, output: null, error: `Goal "${title}" not found` };
        }

        const newContent = content !== undefined ? content : found.content;

        if (status) found.meta.status = status;
        if (priority) found.meta.priority = priority;
        if (tags) found.meta.tags = tags;
        if (smart) {
            // Merge SMART fields with existing
            const existing = (found.meta.smart as Partial<SmartFields>) || {};
            found.meta.smart = { ...existing, ...smart };
        }
        if (addMilestone) {
            const milestones = (found.meta.milestones as string[]) || [];
            found.meta.milestones = [...milestones, addMilestone];
        }

        await writeEntity(found.filepath, found.meta, newContent);

        context.log.info(`Goal updated: ${found.filepath}`);

        return {
            success: true,
            output: {
                filepath: found.filepath,
                title: found.meta.title,
                content: newContent,
                status: found.meta.status,
                priority: found.meta.priority,
                smart: found.meta.smart,
                milestones: found.meta.milestones,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// GOALS.REMOVE
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'goals.remove',
    description: 'Delete a goal',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Goal title to delete', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Removing goal: ${title}`);

        const found = await findEntityByTitle('goal', title);
        if (!found) {
            context.log.error(`Goal not found: ${title}`);
            return { success: false, output: null, error: `Goal "${title}" not found` };
        }

        await fs.unlink(found.filepath);

        context.log.info(`Goal removed: ${found.filepath}`);

        return {
            success: true,
            output: { filepath: found.filepath, title: found.meta.title, deleted: true },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// GOALS.REVIEW - AI review with SMART goal analysis
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'goals.review',
    description: 'Review goal with AI for feedback and SMART analysis',
    type: 'ai',
    capability: 'reason',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Goal title to review', required: true },
            action: { type: 'string', description: 'Action: improve, breakdown, progress, obstacles' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, action = 'improve' } = input as { title: string; action?: string };

        context.log.info(`Reviewing goal: ${title} (${action})`);

        const found = await findEntityByTitle('goal', title);
        if (!found) {
            context.log.error(`Goal not found: ${title}`);
            return { success: false, output: null, error: `Goal "${title}" not found` };
        }

        const fullContext = await context.ctx.getFullContext('todos');
        const smart = (found.meta.smart as Partial<SmartFields>) || {};
        const milestones = (found.meta.milestones as string[]) || [];

        const smartSummary = [
            smart.specific ? `  Specific: ${smart.specific}` : null,
            smart.measurable ? `  Measurable: ${smart.measurable}` : null,
            smart.achievable ? `  Achievable: ${smart.achievable}` : null,
            smart.relevant ? `  Relevant: ${smart.relevant}` : null,
            smart.timeBound ? `  Time-Bound: ${smart.timeBound}` : null,
        ].filter(Boolean).join('\n');

        const goalInfo = `Goal: ${found.meta.title}
Description: ${found.content}
Priority: ${found.meta.priority}
Status: ${found.meta.status}
${smartSummary ? `SMART Criteria:\n${smartSummary}` : 'SMART Criteria: (not yet defined)'}
${milestones.length ? `Milestones:\n${milestones.map(m => `  - ${m}`).join('\n')}` : ''}`;

        let prompt: string;
        switch (action) {
            case 'breakdown':
                prompt = `Break down this goal into specific, actionable milestones and next steps.\n\n${goalInfo}\n\nProvide a structured breakdown with clear milestones and immediate next actions.`;
                break;
            case 'progress':
                prompt = `Analyze progress on this goal and provide encouragement and suggestions.\n\n${goalInfo}\n\nAssess the current progress and suggest next steps.`;
                break;
            case 'obstacles':
                prompt = `Identify potential obstacles and strategies to overcome them.\n\n${goalInfo}\n\nWhat challenges might arise and how can they be addressed?`;
                break;
            case 'improve':
            default:
                prompt = `Review and improve this goal to make it more SMART (Specific, Measurable, Achievable, Relevant, Time-bound). For any missing SMART fields, suggest concrete values.\n\n${goalInfo}\n\nSuggest improvements and fill in any missing SMART criteria.`;
        }

        const review = await context.llm.chat([
            { role: 'system', content: fullContext.combined },
            { role: 'user', content: prompt },
        ]);

        context.log.info('Review completed');

        return {
            success: true,
            output: { title: found.meta.title, content: found.content, smart, action, review },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// GOALS.LIST
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'goals.list',
    description: 'List all goals',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            status: { type: 'string', description: 'Filter by status' },
            priority: { type: 'string', description: 'Filter by priority' },
        },
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { status, priority } = (input as { status?: string; priority?: string }) || {};

        context.log.info('Listing goals');

        const entities = await listEntities('goal');

        const goals = entities
            .filter(e => {
                if (status && e.meta.status !== status) return false;
                if (priority && e.meta.priority !== priority) return false;
                return true;
            })
            .map(e => ({
                title: e.meta.title as string,
                filepath: e.filepath,
                status: e.meta.status as string,
                priority: e.meta.priority as string,
                smart: e.meta.smart as Partial<SmartFields>,
                milestones: (e.meta.milestones as string[]) || [],
                tags: (e.meta.tags as string[]) || [],
            }))
            .sort((a, b) => {
                const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
                const pA = priorityOrder[a.priority] ?? 1;
                const pB = priorityOrder[b.priority] ?? 1;
                if (pA !== pB) return pA - pB;
                const tA = a.smart?.timeBound || '';
                const tB = b.smart?.timeBound || '';
                return tA.localeCompare(tB);
            });

        return { success: true, output: { goals } };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// GOALS.GET
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'goals.get',
    description: 'Get a specific goal by title',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Goal title', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Getting goal: ${title}`);

        const found = await findEntityByTitle('goal', title);
        if (!found) {
            context.log.error(`Goal not found: ${title}`);
            return { success: false, output: null, error: `Goal "${title}" not found` };
        }

        return {
            success: true,
            output: {
                filepath: found.filepath,
                title: found.meta.title,
                content: found.content,
                status: found.meta.status,
                priority: found.meta.priority,
                smart: found.meta.smart,
                milestones: found.meta.milestones,
                tags: found.meta.tags,
                created: found.meta.created,
            },
        };
    },
});
