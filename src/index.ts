#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { todayCommand } from './commands/today.js';
import { rememberCommand } from './commands/remember.js';
import { projectCommand } from './commands/project.js';
import { configCommand } from './commands/config.js';
import { syncCommand } from './commands/sync.js';
import { listTools, getTool } from './tools/index.js';

// Set DOBBIE_ROOT to the directory where dobbie is installed
// This allows dobbie to find its data files
if (!process.env.DOBBIE_ROOT) {
    // Try to find the dobbie root by looking for .socks.md
    const path = await import('path');
    const fs = await import('fs');

    let currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
        const socksPath = path.join(currentDir, '.socks.md');
        try {
            await fs.promises.access(socksPath);
            process.env.DOBBIE_ROOT = currentDir;
            break;
        } catch {
            currentDir = path.dirname(currentDir);
        }
    }

    // If not found, use current directory
    if (!process.env.DOBBIE_ROOT) {
        process.env.DOBBIE_ROOT = process.cwd();
    }
}

const program = new Command();

program
    .name('dobbie')
    .description(chalk.cyan('🧝 Dobbie - Your helpful AI notes assistant'))
    .version('1.0.0');

// Register commands
program.addCommand(todayCommand);
program.addCommand(rememberCommand);
program.addCommand(projectCommand);
program.addCommand(configCommand);
program.addCommand(syncCommand);

// Tool command - run any registered tool
program
    .command('tool <name> [input]')
    .description('Run a tool')
    .action(async (name: string, input?: string) => {
        const tool = getTool(name);

        if (!tool) {
            console.log(chalk.red(`Unknown tool: ${name}`));
            console.log(chalk.gray('\nAvailable tools:'));
            for (const t of listTools()) {
                console.log(chalk.gray(`  - ${t.name}: ${t.description}`));
            }
            return;
        }

        try {
            const result = await tool.execute(input || '');
            console.log(result);
        } catch (error) {
            console.error(chalk.red('Dobbie encountered an error, sir:'), error);
        }
    });

// Tools list command
program
    .command('tools')
    .description('List available tools')
    .action(() => {
        console.log(chalk.cyan('\n🔧 Available Tools:\n'));
        for (const tool of listTools()) {
            const typeIcon = tool.type === 'deterministic' ? '⚡' : '🤖';
            console.log(`  ${typeIcon} ${chalk.bold(tool.name)}`);
            console.log(chalk.gray(`     ${tool.description}`));
            console.log('');
        }
    });

// Default greeting
program
    .action(() => {
        console.log(chalk.cyan(`
🧝 Dobbie is at your service, sir!

Dobbie can help you with:
  ${chalk.bold('dobbie today')}              - See your daily tasks
  ${chalk.bold('dobbie remember "<text>"')}  - Remember something
  ${chalk.bold('dobbie project')}            - Manage projects
  ${chalk.bold('dobbie sync')}               - Sync with GitHub
  ${chalk.bold('dobbie config')}             - Manage settings
  ${chalk.bold('dobbie tools')}              - List available tools

Use ${chalk.bold('dobbie --help')} for more options, sir.
`));
    });

program.parse();
