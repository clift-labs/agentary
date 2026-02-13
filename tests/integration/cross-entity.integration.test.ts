import { describe, it, expect } from 'vitest';
import { useTestVault, executeTool } from './helpers.js';

/**
 * Cross-entity test: create one of each entity type in the same project
 * and verify they coexist independently.
 */
describe('cross-entity integration', () => {
    useTestVault();

    it('should create one of each entity type', async () => {
        const results = await Promise.all([
            executeTool('notes.add', { title: 'Cross Note', content: 'A cross-entity note.' }),
            executeTool('tasks.add', { title: 'Cross Task', content: 'A cross-entity task.', dueDate: '2026-04-01' }),
            executeTool('goals.add', { title: 'Cross Goal', content: 'A cross-entity goal.' }),
            executeTool('research.add', { title: 'Cross Research', content: 'A cross-entity research.' }),
            executeTool('events.add', {
                title: 'Cross Event',
                startDate: '2026-03-01T10:00:00',
                endDate: '2026-03-01T11:00:00',
                location: 'Room B',
                content: 'A cross-entity event.',
            }),
        ]);

        for (const result of results) {
            expect(result.success).toBe(true);
        }
    });

    it('should list each entity type independently', async () => {
        const [notes, tasks, goals, research, events] = await Promise.all([
            executeTool('notes.list'),
            executeTool('tasks.list'),
            executeTool('goals.list'),
            executeTool('research.list'),
            executeTool('events.list'),
        ]);

        expect(notes.success).toBe(true);
        expect(tasks.success).toBe(true);
        expect(goals.success).toBe(true);
        expect(research.success).toBe(true);
        expect(events.success).toBe(true);

        expect((notes.output as any).notes.length).toBe(1);
        expect((tasks.output as any).tasks.length).toBe(1);
        expect((goals.output as any).goals.length).toBe(1);
        expect((research.output as any).research.length).toBe(1);
        expect((events.output as any).events.length).toBeGreaterThanOrEqual(1);
    });

    it('should remove all entities', async () => {
        const results = await Promise.all([
            executeTool('notes.remove', { title: 'Cross Note' }),
            executeTool('tasks.remove', { title: 'Cross Task' }),
            executeTool('goals.remove', { title: 'Cross Goal' }),
            executeTool('research.remove', { title: 'Cross Research' }),
            executeTool('events.remove', { title: 'Cross Event' }),
        ]);

        for (const result of results) {
            expect(result.success).toBe(true);
        }
    });

    it('should have empty lists after removal', async () => {
        const [notes, tasks, goals, research] = await Promise.all([
            executeTool('notes.list'),
            executeTool('tasks.list'),
            executeTool('goals.list'),
            executeTool('research.list'),
        ]);

        expect((notes.output as any).notes.length).toBe(0);
        expect((tasks.output as any).tasks.length).toBe(0);
        expect((goals.output as any).goals.length).toBe(0);
        expect((research.output as any).research.length).toBe(0);
    });
});
