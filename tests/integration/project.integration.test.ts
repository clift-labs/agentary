import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { useTestVault, executeTool, getVaultDir, TEST_PROJECT } from './helpers.js';

describe('project integration', () => {
    useTestVault();

    it('should have created the test project directory on disk', async () => {
        const projectDir = path.join(getVaultDir(), 'projects', TEST_PROJECT);
        const stat = await fs.stat(projectDir);
        expect(stat.isDirectory()).toBe(true);
    });

    it('should have created all entity sub-directories', async () => {
        const projectDir = path.join(getVaultDir(), 'projects', TEST_PROJECT);
        for (const sub of ['notes', 'todos', 'research', 'events', 'inbox', 'goals']) {
            const stat = await fs.stat(path.join(projectDir, sub));
            expect(stat.isDirectory()).toBe(true);
        }
    });

    it('project.current should return the active project', async () => {
        const result = await executeTool('project.current');
        expect(result.success).toBe(true);
        expect((result.output as any).projectName).toBe(TEST_PROJECT);
    });

    it('project.list should include the test project', async () => {
        const result = await executeTool('project.list');
        expect(result.success).toBe(true);
        expect((result.output as any).projects).toContain(TEST_PROJECT);
    });

    it('project.create should create a second project', async () => {
        const result = await executeTool('project.create', { name: 'second-project', switchTo: false });
        expect(result.success).toBe(true);

        const projectDir = path.join(getVaultDir(), 'projects', 'second-project');
        const stat = await fs.stat(projectDir);
        expect(stat.isDirectory()).toBe(true);
    });

    it('project.create should reject duplicate project names', async () => {
        const result = await executeTool('project.create', { name: TEST_PROJECT });
        expect(result.success).toBe(false);
        expect(result.error).toContain('already exists');
    });

    it('project.use should switch to another project', async () => {
        await executeTool('project.create', { name: 'switch-target', switchTo: false });
        const result = await executeTool('project.use', { name: 'switch-target' });
        expect(result.success).toBe(true);

        const current = await executeTool('project.current');
        expect((current.output as any).projectName).toBe('switch-target');

        // Switch back to test project for remaining tests
        await executeTool('project.use', { name: TEST_PROJECT });
    });

    it('project.use should fail for non-existent project', async () => {
        const result = await executeTool('project.use', { name: 'does-not-exist' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('does not exist');
    });
});
