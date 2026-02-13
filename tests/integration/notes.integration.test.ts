import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { useTestVault, executeTool, getVaultDir, TEST_PROJECT } from './helpers.js';

describe('notes integration', () => {
    useTestVault();

    it('should add a note', async () => {
        const result = await executeTool('notes.add', {
            title: 'Meeting Notes',
            content: 'Discussed project timeline and deliverables.',
            tags: ['work', 'meeting'],
        });

        expect(result.success).toBe(true);

        // Verify the file exists on disk
        const notesDir = path.join(getVaultDir(), 'projects', TEST_PROJECT, 'notes');
        const files = await fs.readdir(notesDir);
        const noteFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('.'));
        expect(noteFiles.length).toBe(1);
        expect(noteFiles[0]).toBe('meeting-notes.md');
    });

    it('should reject duplicate note titles', async () => {
        const result = await executeTool('notes.add', {
            title: 'Meeting Notes',
            content: 'duplicate',
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('exists');
    });

    it('should list notes', async () => {
        const result = await executeTool('notes.list');
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.notes.length).toBe(1);
        expect(output.notes[0].title).toBe('Meeting Notes');
    });

    it('should get a note by title', async () => {
        const result = await executeTool('notes.get', { title: 'Meeting Notes' });
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.title).toBe('Meeting Notes');
        expect(output.content).toContain('Discussed project timeline');
    });

    it('should update a note by appending content', async () => {
        const result = await executeTool('notes.update', {
            title: 'Meeting Notes',
            appendContent: '\n\nAction items: follow up next week.',
        });
        expect(result.success).toBe(true);

        // Verify the content was appended
        const get = await executeTool('notes.get', { title: 'Meeting Notes' });
        expect((get.output as any).content).toContain('Action items');
    });

    it('should update a note with new tags', async () => {
        const result = await executeTool('notes.update', {
            title: 'Meeting Notes',
            tags: ['work', 'meeting', 'important'],
        });
        expect(result.success).toBe(true);
    });

    it('should fail to update a non-existent note', async () => {
        const result = await executeTool('notes.update', {
            title: 'Ghost Note',
            appendContent: 'nope',
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
    });

    it('should add a second note', async () => {
        const result = await executeTool('notes.add', {
            title: 'Architecture Decision',
            content: 'We chose microservices over monolith.',
        });
        expect(result.success).toBe(true);

        const list = await executeTool('notes.list');
        expect((list.output as any).notes.length).toBe(2);
    });

    it('should remove a note', async () => {
        const result = await executeTool('notes.remove', { title: 'Architecture Decision' });
        expect(result.success).toBe(true);

        const list = await executeTool('notes.list');
        expect((list.output as any).notes.length).toBe(1);
    });

    it('should fail to remove a non-existent note', async () => {
        const result = await executeTool('notes.remove', { title: 'No Such Note' });
        expect(result.success).toBe(false);
    });
});
