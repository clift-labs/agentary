import { describe, it, expect } from 'vitest';
import { useTestVault, executeTool } from './helpers.js';

describe('goals integration', () => {
    useTestVault();

    it('should add a goal', async () => {
        const result = await executeTool('goals.add', {
            title: 'Launch MVP',
            content: 'Ship the minimum viable product by end of Q1.',
            priority: 'high',
            smart: {
                specific: 'Ship v1 of the product with core features',
                measurable: '100 beta users signed up',
                achievable: 'Team of 4 developers',
                relevant: 'Core business objective',
                timeBound: '2026-03-31',
            },
            tags: ['product', 'q1'],
        });
        expect(result.success).toBe(true);
    });

    it('should add a second goal', async () => {
        const result = await executeTool('goals.add', {
            title: 'Improve Test Coverage',
            content: 'Get code coverage above 80%.',
            priority: 'medium',
        });
        expect(result.success).toBe(true);
    });

    it('should reject duplicate goal titles', async () => {
        const result = await executeTool('goals.add', { title: 'Launch MVP' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('exists');
    });

    it('should list goals', async () => {
        const result = await executeTool('goals.list');
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.goals.length).toBe(2);
    });

    it('should get a goal by title', async () => {
        const result = await executeTool('goals.get', { title: 'Launch MVP' });
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.title).toBe('Launch MVP');
        expect(output.content).toContain('minimum viable product');
    });

    it('should update goal status', async () => {
        const result = await executeTool('goals.update', {
            title: 'Launch MVP',
            status: 'completed',
        });
        expect(result.success).toBe(true);
    });

    it('should add a milestone to a goal', async () => {
        const result = await executeTool('goals.update', {
            title: 'Improve Test Coverage',
            addMilestone: 'Reach 50% coverage',
        });
        expect(result.success).toBe(true);
    });

    it('should fail to update non-existent goal', async () => {
        const result = await executeTool('goals.update', {
            title: 'Ghost Goal',
            status: 'paused',
        });
        expect(result.success).toBe(false);
    });

    it('should remove a goal', async () => {
        const result = await executeTool('goals.remove', { title: 'Improve Test Coverage' });
        expect(result.success).toBe(true);

        const list = await executeTool('goals.list');
        expect((list.output as any).goals.length).toBe(1);
    });

    it('should fail to remove non-existent goal', async () => {
        const result = await executeTool('goals.remove', { title: 'No Goal' });
        expect(result.success).toBe(false);
    });
});
