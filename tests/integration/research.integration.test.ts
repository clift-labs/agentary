import { describe, it, expect } from 'vitest';
import { useTestVault, executeTool } from './helpers.js';

describe('research integration', () => {
    useTestVault();

    it('should add a research document', async () => {
        const result = await executeTool('research.add', {
            title: 'Database Comparison',
            content: 'Evaluating PostgreSQL vs MySQL for the new service.',
            sources: ['https://postgresql.org', 'https://mysql.com'],
            tags: ['infrastructure', 'database'],
        });
        expect(result.success).toBe(true);
    });

    it('should add a second research document', async () => {
        const result = await executeTool('research.add', {
            title: 'Auth Providers',
            content: 'Comparing Auth0 vs Cognito vs Firebase Auth.',
        });
        expect(result.success).toBe(true);
    });

    it('should reject duplicate research titles', async () => {
        const result = await executeTool('research.add', { title: 'Database Comparison' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('exists');
    });

    it('should list research documents', async () => {
        const result = await executeTool('research.list');
        expect(result.success).toBe(true);
        const output = result.output as any;
        expect(output.research.length).toBe(2);
    });

    it('should update a research document', async () => {
        const result = await executeTool('research.update', {
            title: 'Database Comparison',
            appendContent: '\n\nConclusion: PostgreSQL wins for JSONB support.',
            status: 'complete',
        });
        expect(result.success).toBe(true);
    });

    it('should add a source to a research document', async () => {
        const result = await executeTool('research.update', {
            title: 'Auth Providers',
            addSources: ['https://auth0.com/docs'],
        });
        expect(result.success).toBe(true);
    });

    it('should fail to update non-existent research', async () => {
        const result = await executeTool('research.update', {
            title: 'Ghost Research',
            status: 'complete',
        });
        expect(result.success).toBe(false);
    });

    it('should remove a research document', async () => {
        const result = await executeTool('research.remove', { title: 'Auth Providers' });
        expect(result.success).toBe(true);

        const list = await executeTool('research.list');
        expect((list.output as any).research.length).toBe(1);
    });

    it('should fail to remove non-existent research', async () => {
        const result = await executeTool('research.remove', { title: 'No Research' });
        expect(result.success).toBe(false);
    });
});
