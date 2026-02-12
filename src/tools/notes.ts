import path from 'path';
import {
    type NoteEntity,
    slugify,
    createEntityMeta,
    ensureEntityDir,
    findEntityByTitle,
    listEntities,
    writeEntity,
} from '../entities/entity.js';
import { getActiveProject } from '../state/manager.js';
import { registerServiceTool, type ServiceToolResult } from './types.js';
import { promises as fs } from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// NOTES.ADD - Create a new note
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'notes.add',
    description: 'Create a new note in the current project',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Note title', required: true },
            content: { type: 'string', description: 'Note content' },
            tags: { type: 'array', description: 'Tags for the note' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content = '', tags = [] } = input as { title: string; content?: string; tags?: string[] };

        context.log.info(`Creating note: ${title}`);

        const project = await getActiveProject();
        if (!project) {
            return { success: false, output: null, error: 'No active project' };
        }

        // Check for duplicates
        const existing = await findEntityByTitle('note', title);
        if (existing) {
            context.log.warn(`Note already exists: ${title}`);
            return { success: false, output: null, error: `Note "${title}" already exists` };
        }

        const notesDir = await ensureEntityDir('note');
        const slug = slugify(title);
        const filepath = path.join(notesDir, `${slug}.md`);

        const meta: NoteEntity = {
            ...createEntityMeta('note', title, { tags, project }),
            entityType: 'note',
        };

        await writeEntity(filepath, { ...meta }, content);

        context.log.info(`Note created: ${filepath}`);

        return {
            success: true,
            output: { filepath, title, content, tags },
            canvasUpdate: {
                type: 'note',
                title,
                content,
                dirty: false,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTES.UPDATE - Update an existing note
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'notes.update',
    description: 'Update an existing note',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Note title to update', required: true },
            content: { type: 'string', description: 'New content' },
            appendContent: { type: 'string', description: 'Content to append' },
            tags: { type: 'array', description: 'Replace tags' },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title, content, appendContent, tags } = input as {
            title: string; content?: string; appendContent?: string; tags?: string[];
        };

        context.log.info(`Updating note: ${title}`);

        const found = await findEntityByTitle('note', title);
        if (!found) {
            context.log.error(`Note not found: ${title}`);
            return { success: false, output: null, error: `Note "${title}" not found` };
        }

        let newContent: string;
        if (content !== undefined) {
            newContent = content;
        } else if (appendContent) {
            newContent = found.content + '\n\n' + appendContent;
        } else {
            newContent = found.content;
        }

        if (tags) found.meta.tags = tags;

        await writeEntity(found.filepath, found.meta, newContent);

        context.log.info(`Note updated: ${found.filepath}`);

        return {
            success: true,
            output: { filepath: found.filepath, title: found.meta.title, content: newContent },
            canvasUpdate: {
                type: 'note',
                title: found.meta.title as string,
                content: newContent,
                dirty: false,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTES.REMOVE - Delete a note
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'notes.remove',
    description: 'Delete a note',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Note title to delete', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Removing note: ${title}`);

        const found = await findEntityByTitle('note', title);
        if (!found) {
            context.log.error(`Note not found: ${title}`);
            return { success: false, output: null, error: `Note "${title}" not found` };
        }

        await fs.unlink(found.filepath);

        context.log.info(`Note removed: ${found.filepath}`);

        return {
            success: true,
            output: { filepath: found.filepath, title: found.meta.title, deleted: true },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTES.REVIEW - Review a note with AI
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'notes.review',
    description: 'Review a note with AI assistance',
    type: 'ai',
    capability: 'reason',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Note title to review', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Reviewing note: ${title}`);

        const found = await findEntityByTitle('note', title);
        if (!found) {
            context.log.error(`Note not found: ${title}`);
            return { success: false, output: null, error: `Note "${title}" not found` };
        }

        const fullContext = await context.ctx.getFullContext('notes');

        const prompt = `Please review this note and provide constructive feedback on how to improve it. Focus on clarity, organization, and completeness.

Note Title: ${found.meta.title}

Note Content:
${found.content}

Provide your review with specific suggestions for improvement.`;

        const review = await context.llm.chat([
            { role: 'system', content: fullContext.combined },
            { role: 'user', content: prompt },
        ]);

        context.log.info('Review completed');

        return {
            success: true,
            output: { title: found.meta.title, content: found.content, review },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTES.LIST - List all notes in the current project
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'notes.list',
    description: 'List all notes in the current project',
    type: 'deterministic',
    execute: async (_input, context): Promise<ServiceToolResult> => {
        context.log.info('Listing notes');

        const entities = await listEntities('note');
        const notes = entities.map(e => ({
            title: e.meta.title as string,
            filepath: e.filepath,
            created: e.meta.created as string,
            tags: (e.meta.tags as string[]) || [],
        }));

        return { success: true, output: { notes } };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTES.GET - Get a specific note
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'notes.get',
    description: 'Get a specific note by title',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Note title', required: true },
        },
        required: ['title'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { title } = input as { title: string };

        context.log.info(`Getting note: ${title}`);

        const found = await findEntityByTitle('note', title);
        if (!found) {
            return { success: false, output: null, error: `Note "${title}" not found` };
        }

        return {
            success: true,
            output: {
                filepath: found.filepath,
                title: found.meta.title,
                content: found.content,
                tags: found.meta.tags,
                created: found.meta.created,
            },
            canvasUpdate: {
                type: 'note',
                title: found.meta.title as string,
                content: found.content,
                dirty: false,
            },
        };
    },
});
