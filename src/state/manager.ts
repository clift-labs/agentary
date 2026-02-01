import { promises as fs } from 'fs';
import path from 'path';
import { StateSchema, type State } from '../schemas/index.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

// Get the dobbie root directory (where the package.json is)
function getDobbieRoot(): string {
    // This will be set when building, for now use cwd or find package.json
    return process.env.DOBBIE_ROOT || process.cwd();
}

const STATE_FILE = '.state.json';

function getStatePath(): string {
    return path.join(getDobbieRoot(), STATE_FILE);
}

const DEFAULT_STATE: State = {
    activeProject: null,
    lastUsed: undefined,
};

export async function loadState(): Promise<State> {
    try {
        const data = await fs.readFile(getStatePath(), 'utf-8');
        return StateSchema.parse(JSON.parse(data));
    } catch {
        return DEFAULT_STATE;
    }
}

export async function saveState(state: State): Promise<void> {
    state.lastUsed = new Date().toISOString().split('T')[0];
    await fs.writeFile(getStatePath(), JSON.stringify(state, null, 2));
}

export async function getActiveProject(): Promise<string | null> {
    const state = await loadState();
    return state.activeProject;
}

export async function setActiveProject(projectName: string): Promise<void> {
    const state = await loadState();
    state.activeProject = projectName;
    await saveState(state);
}

export async function clearActiveProject(): Promise<void> {
    const state = await loadState();
    state.activeProject = null;
    await saveState(state);
}

export async function requireProject(): Promise<string> {
    const activeProject = await getActiveProject();

    if (activeProject) {
        return activeProject;
    }

    // Prompt the user for a project
    console.log(chalk.yellow("\nDobbie needs to know which project, sir."));

    const projects = await listProjects();

    if (projects.length === 0) {
        console.log(chalk.gray("No projects exist yet. Dobbie will create one for you, sir."));
        const { projectName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'What shall Dobbie call this project, sir?',
                validate: (input: string) => input.length > 0 || 'Please enter a project name',
            },
        ]);
        await createProject(projectName);
        await setActiveProject(projectName);
        return projectName;
    }

    const { selectedProject } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedProject',
            message: 'What project, sir?',
            choices: projects,
        },
    ]);

    await setActiveProject(selectedProject);
    return selectedProject;
}

export async function listProjects(): Promise<string[]> {
    const projectsDir = path.join(getDobbieRoot(), 'projects');

    try {
        const entries = await fs.readdir(projectsDir, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
            .map(entry => entry.name);
    } catch {
        return [];
    }
}

export async function createProject(name: string): Promise<void> {
    const projectDir = path.join(getDobbieRoot(), 'projects', name);

    // Create project directories
    await fs.mkdir(path.join(projectDir, 'notes'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'todos'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'research'), { recursive: true });

    // Create project .socks.md
    const today = new Date().toISOString().split('T')[0];
    const socksContent = `---
title: "${name} Context"
created: ${today}
tags: [context, project]
---

# ${name}

Project-specific context and notes.

## Goals

-

## Notes

-
`;

    await fs.writeFile(path.join(projectDir, '.socks.md'), socksContent);

    // Create sub-folder .socks.md files
    const subFolders = ['notes', 'todos', 'research'];
    for (const folder of subFolders) {
        const folderSocks = `---
title: "${name} ${folder.charAt(0).toUpperCase() + folder.slice(1)} Context"
created: ${today}
tags: [context, ${folder}]
---

# ${name} - ${folder.charAt(0).toUpperCase() + folder.slice(1)}

`;
        await fs.writeFile(path.join(projectDir, folder, '.socks.md'), folderSocks);
    }
}

export async function projectExists(name: string): Promise<boolean> {
    const projectDir = path.join(getDobbieRoot(), 'projects', name);
    try {
        const stat = await fs.stat(projectDir);
        return stat.isDirectory();
    } catch {
        return false;
    }
}

export function getDobbieRootPath(): string {
    return getDobbieRoot();
}
