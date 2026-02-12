import path from 'path';
import { promises as fs } from 'fs';
import {
    type ResearchEntity,
    type ResearchStatus,
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
// RESEARCH.ADD
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'research.add',
    description: 'Create a new research document',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Research title', required: true },
            content: { type: 'string', description: 'Initial content or questions' },
            tags: { type: 'array', description: 'Tags for categorization' },
            sources: { type: 'array', description: 'Initial source URLs' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content = '', tags = [], sources = [] } = input as {
            title: string; content?: string; tags?: string[]; sources?: string[];
        };

        context.log.info(`Creating research: ${title}`);

        const project = await getActiveProject();
        if (!project) {
            return { success: false, output: null, error: 'No active project' };
        }

        const existing = await findEntityByTitle('research', title);
        if (existing) {
            context.log.warn(`Research already exists: ${title}`);
            return { success: false, output: null, error: `Research "${title}" already exists` };
        }

        const researchDir = await ensureEntityDir('research');
        const slug = slugify(title);
        const filepath = path.join(researchDir, `${slug}.md`);

        const meta: ResearchEntity = {
            ...createEntityMeta('research', title, { tags, project }),
            entityType: 'research',
            status: 'draft',
            sources,
        };

        await writeEntity(filepath, { ...meta }, content);

        context.log.info(`Research created: ${filepath}`);

        return {
            success: true,
            output: { filepath, title, content, tags, sources, status: 'draft' },
            canvasUpdate: {
                type: 'research',
                title,
                content,
                dirty: false,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH.UPDATE
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'research.update',
    description: 'Update research document',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Research title', required: true },
            content: { type: 'string', description: 'New content' },
            appendContent: { type: 'string', description: 'Content to append' },
            addSources: { type: 'array', description: 'Sources to add' },
            status: { type: 'string', description: 'Status: draft, in-progress, complete' },
            tags: { type: 'array', description: 'Replace tags' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content, appendContent, addSources, status, tags } = input as {
            title: string; content?: string; appendContent?: string;
            addSources?: string[]; status?: ResearchStatus; tags?: string[];
        };

        context.log.info(`Updating research: ${title}`);

        const found = await findEntityByTitle('research', title);
        if (!found) {
            context.log.error(`Research not found: ${title}`);
            return { success: false, output: null, error: `Research "${title}" not found` };
        }

        let newContent: string;
        if (content !== undefined) {
            newContent = content;
        } else if (appendContent) {
            newContent = found.content + '\n\n' + appendContent;
        } else {
            newContent = found.content;
        }

        if (addSources) {
            found.meta.sources = [...((found.meta.sources as string[]) || []), ...addSources];
        }
        if (status) found.meta.status = status;
        if (tags) found.meta.tags = tags;

        await writeEntity(found.filepath, found.meta, newContent);

        context.log.info(`Research updated: ${found.filepath}`);

        return {
            success: true,
            output: {
                filepath: found.filepath,
                title: found.meta.title,
                content: newContent,
                status: found.meta.status,
                sources: found.meta.sources,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH.REMOVE
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'research.remove',
    description: 'Delete a research document',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Research title to delete', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Removing research: ${title}`);

        const found = await findEntityByTitle('research', title);
        if (!found) {
            context.log.error(`Research not found: ${title}`);
            return { success: false, output: null, error: `Research "${title}" not found` };
        }

        await fs.unlink(found.filepath);

        context.log.info(`Research removed: ${found.filepath}`);

        return {
            success: true,
            output: { filepath: found.filepath, title: found.meta.title, deleted: true },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH.REVIEW
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'research.review',
    description: 'Review research with AI for insights and next steps',
    type: 'ai',
    capability: 'reason',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Research title to review', required: true },
            action: { type: 'string', description: 'Action: summarize, questions, gaps' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, action = 'summarize' } = input as { title: string; action?: string };

        context.log.info(`Reviewing research: ${title} (${action})`);

        const found = await findEntityByTitle('research', title);
        if (!found) {
            context.log.error(`Research not found: ${title}`);
            return { success: false, output: null, error: `Research "${title}" not found` };
        }

        const fullContext = await context.ctx.getFullContext('research');
        const sources = (found.meta.sources as string[]) || [];

        let prompt: string;
        switch (action) {
            case 'questions':
                prompt = `Generate follow-up research questions for this topic.

Research: ${found.meta.title}
Content: ${found.content}
${sources.length > 0 ? `Sources: ${sources.join(', ')}` : ''}

What questions should be explored next?`;
                break;
            case 'gaps':
                prompt = `Identify gaps in this research that need to be addressed.

Research: ${found.meta.title}
Content: ${found.content}
Status: ${found.meta.status}

What areas need more investigation?`;
                break;
            case 'summarize':
            default:
                prompt = `Provide a concise summary of this research.

Research: ${found.meta.title}
Content: ${found.content}
${sources.length > 0 ? `Sources: ${sources.join(', ')}` : ''}

Summarize the key findings and insights.`;
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
// RESEARCH.LIST
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'research.list',
    description: 'List all research documents',
    type: 'deterministic',
    execute: async (_input, context): Promise<ServiceToolResult> => {
        context.log.info('Listing research');

        const entities = await listEntities('research');
        const items = entities.map(e => ({
            title: e.meta.title as string,
            filepath: e.filepath,
            status: e.meta.status as string,
            tags: (e.meta.tags as string[]) || [],
            sources: (e.meta.sources as string[]) || [],
        }));

        return { success: true, output: { research: items } };
    },
});
