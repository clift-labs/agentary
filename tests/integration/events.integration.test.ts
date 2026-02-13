import { describe, it, expect } from 'vitest';
import { useTestVault, executeTool } from './helpers.js';

describe('events integration', () => {
    useTestVault();

    it('should add an event', async () => {
        const result = await executeTool('events.add', {
            title: 'Team Standup',
            startDate: '2026-02-14T09:00:00',
            endDate: '2026-02-14T09:30:00',
            location: 'Conference Room A',
            content: 'Daily standup meeting.',
            tags: ['work', 'standup'],
        });
        expect(result.success).toBe(true);
    });

    it('should add a second event', async () => {
        const result = await executeTool('events.add', {
            title: 'Sprint Review',
            startDate: '2026-02-14T14:00:00',
            endDate: '2026-02-14T15:00:00',
            location: 'Main Hall',
            content: 'Sprint review meeting.',
        });
        expect(result.success).toBe(true);
    });

    it('should list events', async () => {
        const result = await executeTool('events.list');
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.events.length).toBeGreaterThanOrEqual(2);
    });

    it('should update an event', async () => {
        const result = await executeTool('events.update', {
            title: 'Team Standup',
            location: 'Zoom Call',
        });
        expect(result.success).toBe(true);
    });

    it('should fail to update non-existent event', async () => {
        const result = await executeTool('events.update', {
            title: 'Phantom Event',
            location: 'Nowhere',
        });
        expect(result.success).toBe(false);
    });

    it('should remove an event', async () => {
        const result = await executeTool('events.remove', { title: 'Sprint Review' });
        expect(result.success).toBe(true);
    });

    it('should fail to remove non-existent event', async () => {
        const result = await executeTool('events.remove', { title: 'No Event' });
        expect(result.success).toBe(false);
    });
});
