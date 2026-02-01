import { Command } from 'commander';
import chalk from 'chalk';
import {
    getActiveProject,
    setActiveProject,
    listProjects,
    createProject,
    projectExists,
} from '../state/manager.js';

export const projectCommand = new Command('project')
    .description('Manage projects');

// Default action - show current project
projectCommand
    .action(async () => {
        const active = await getActiveProject();
        if (active) {
            console.log(chalk.cyan(`🎯 Active project: ${chalk.bold(active)}`));
        } else {
            console.log(chalk.yellow('No active project, sir. Use `dobbie project switch <name>` to set one.'));
        }
    });

// List projects
projectCommand
    .command('list')
    .alias('ls')
    .description('List all projects')
    .action(async () => {
        const projects = await listProjects();
        const active = await getActiveProject();

        if (projects.length === 0) {
            console.log(chalk.yellow('No projects yet, sir. Create one with `dobbie project new <name>`'));
            return;
        }

        console.log(chalk.cyan('\n📁 Projects:\n'));
        for (const project of projects) {
            if (project === active) {
                console.log(chalk.green(`  ● ${project} (active)`));
            } else {
                console.log(chalk.gray(`  ○ ${project}`));
            }
        }
        console.log('');
    });

// Switch project
projectCommand
    .command('switch <name>')
    .description('Switch to a project')
    .action(async (name: string) => {
        const exists = await projectExists(name);

        if (!exists) {
            console.log(chalk.red(`Project "${name}" does not exist, sir.`));
            console.log(chalk.gray(`Create it with: dobbie project new ${name}`));
            return;
        }

        await setActiveProject(name);
        console.log(chalk.green(`✓ Switched to project "${name}", sir!`));
    });

// Create new project
projectCommand
    .command('new <name>')
    .description('Create a new project')
    .action(async (name: string) => {
        const exists = await projectExists(name);

        if (exists) {
            console.log(chalk.yellow(`Project "${name}" already exists, sir.`));
            return;
        }

        console.log(chalk.gray(`Creating project "${name}"...`));
        await createProject(name);
        await setActiveProject(name);
        console.log(chalk.green(`✓ Created and switched to project "${name}", sir!`));
    });

export default projectCommand;
