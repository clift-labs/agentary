import { promises as fs } from 'fs';
import path from 'path';
import {
    getActiveProject,
    setActiveProject,
    listProjects,
    createProject,
    projectExists,
    getVaultRoot,
} from '../state/manager.js';
import { registerServiceTool, type ServiceToolResult } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT.CREATE - Create a new project
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'project.create',
    description: 'Create a new project and optionally switch to it',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Project name', required: true },
            switchTo: { type: 'boolean', description: 'Switch to the new project after creation' },
        },
        required: ['name'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { name, switchTo = true } = input as { name: string; switchTo?: boolean };

        context.log.info(`Creating project: ${name}`);

        const exists = await projectExists(name);
        if (exists) {
            context.log.warn(`Project already exists: ${name}`);
            return {
                success: false,
                output: null,
                error: `Project "${name}" already exists`,
            };
        }

        await createProject(name);
        context.log.info(`Project created: ${name}`);

        if (switchTo) {
            await setActiveProject(name);
            context.log.info(`Switched to project: ${name}`);
        }

        return {
            success: true,
            output: { projectName: name, isActive: switchTo },
            tokensToSet: switchTo ? { project_name: name } : undefined,
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT.USE - Switch to an existing project
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'project.use',
    description: 'Switch to an existing project',
    type: 'deterministic',
    inputSchema: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Project name', required: true },
        },
        required: ['name'],
    },
    execute: async (input, context): Promise<ServiceToolResult> => {
        const { name } = input as { name: string };

        context.log.info(`Switching to project: ${name}`);

        const exists = await projectExists(name);
        if (!exists) {
            context.log.error(`Project not found: ${name}`);
            return {
                success: false,
                output: null,
                error: `Project "${name}" does not exist`,
            };
        }

        await setActiveProject(name);

        return {
            success: true,
            output: { projectName: name },
            tokensToSet: { project_name: name },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT.LIST - List all projects
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'project.list',
    description: 'List all projects',
    type: 'deterministic',
    execute: async (input, context): Promise<ServiceToolResult> => {
        context.log.info('Listing projects');

        const projects = await listProjects();
        const activeProject = await getActiveProject();

        return {
            success: true,
            output: {
                projects,
                activeProject,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT.CURRENT - Get current active project
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'project.current',
    description: 'Get the currently active project',
    type: 'deterministic',
    execute: async (input, context): Promise<ServiceToolResult> => {
        const activeProject = await getActiveProject();

        return {
            success: true,
            output: { projectName: activeProject },
        };
    },
});
