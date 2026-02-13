import { describe, it, expect } from 'vitest';
import { useTestVault, executeTool } from './helpers.js';

describe('tasks integration', () => {
    useTestVault();

    it('should add a task', async () => {
        const result = await executeTool('tasks.add', {
            title: 'Implement login page',
            content: 'Build the login form with email and password fields.',
            priority: 'high',
            dueDate: '2026-03-01',
            tags: ['frontend'],
        });
        expect(result.success).toBe(true);
    });

    it('should add a second task', async () => {
        const result = await executeTool('tasks.add', {
            title: 'Write API tests',
            content: 'Cover all endpoints with integration tests.',
            priority: 'medium',
            dueDate: '2026-03-15',
        });
        expect(result.success).toBe(true);
    });

    it('should reject duplicate task titles', async () => {
        const result = await executeTool('tasks.add', {
            title: 'Implement login page',
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('exists');
    });

    it('should list tasks', async () => {
        const result = await executeTool('tasks.list');
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.tasks.length).toBe(2);
    });

    it('should update task status', async () => {
        const result = await executeTool('tasks.update', {
            title: 'Implement login page',
            status: 'in-progress',
        });
        expect(result.success).toBe(true);
    });

    it('should update task priority and due date', async () => {
        const result = await executeTool('tasks.update', {
            title: 'Implement login page',
            priority: 'critical',
            dueDate: '2026-02-28',
        });
        expect(result.success).toBe(true);
    });

    it('should fail to update non-existent task', async () => {
        const result = await executeTool('tasks.update', {
            title: 'Non-existent task',
            status: 'done',
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
    });

    it('should remove a task', async () => {
        const result = await executeTool('tasks.remove', { title: 'Write API tests' });
        expect(result.success).toBe(true);

        const list = await executeTool('tasks.list');
        expect((list.output as any).tasks.length).toBe(1);
    });

    it('should fail to remove non-existent task', async () => {
        const result = await executeTool('tasks.remove', { title: 'Ghost Task' });
        expect(result.success).toBe(false);
    });
});
