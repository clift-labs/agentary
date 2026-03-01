import { Command } from 'commander';
import { getResponse, refreshResponseCache } from '../responses.js';
import { debug } from '../utils/debug.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import { findVaultRoot, saveState, loadState } from '../state/manager.js';

export const initCommand = new Command('init')
    .description('Initialize a new dobbie vault in the current directory')
    .action(async () => {
        const cwd = process.cwd();
        const socksPath = path.join(cwd, '.socks.md');

        // Check if already a vault
        const existingVault = await findVaultRoot();
        if (existingVault === cwd) {
            console.log(chalk.yellow('This directory is already a dobbie vault.'));
            return;
        }

        if (existingVault) {
            console.log(chalk.yellow(`A parent vault exists at: ${existingVault}`));
            console.log(chalk.gray('Creating a vault here would create a nested vault.'));
            return;
        }

        // Check if .socks.md already exists
        try {
            await fs.access(socksPath);
            console.log(chalk.yellow('.socks.md already exists. This is already a vault.'));
            return;
        } catch (err) {
            debug('init', err);
            // Good, doesn't exist
        }

        console.log(chalk.gray('Creating a new dobbie vault...'));

        const today = new Date().toISOString().split('T')[0];
        const vaultName = path.basename(cwd);

        // Create root .socks.md
        const rootSocks = `---
title: "${vaultName} Vault"
created: ${today}
tags: [context, system, root]
---

# ${vaultName}

## Personality

Dobbie is a helpful, polite English house-elf. He is:
- Always respectful, using varied honorifics
- Eager to assist with any task
- Formal but warm in tone
- Humble and dedicated to serving well

## Global Rules

- All markdown files use YAML frontmatter
- Context is read from deepest folder up to root
- Projects are first-class citizens

## User Preferences

- Timezone: Local machine time
- Date format: YYYY-MM-DD
`;
        await fs.writeFile(socksPath, rootSocks);

        // Create projects folder
        await fs.mkdir(path.join(cwd, 'projects'), { recursive: true });
        await fs.writeFile(path.join(cwd, 'projects', '.socks.md'), `---
title: "Projects Context"
created: ${today}
tags: [context, projects]
---

# Projects

Each project has its own folder with todos, notes, and research.
`);

        // Create global folder with todos and schedule
        await fs.mkdir(path.join(cwd, 'global', 'todos'), { recursive: true });
        await fs.mkdir(path.join(cwd, 'global', 'schedule'), { recursive: true });

        await fs.writeFile(path.join(cwd, 'global', '.socks.md'), `---
title: "Global Context"
created: ${today}
tags: [context, global]
---

# Global

Cross-project items that apply everywhere.
`);

        await fs.writeFile(path.join(cwd, 'global', 'todos', '.socks.md'), `---
title: "Global Todos Context"
created: ${today}
tags: [context, todos, global]
---

# Global Todos

Tasks that cut across all projects.
`);

        await fs.writeFile(path.join(cwd, 'global', 'schedule', '.socks.md'), `---
title: "Schedule Context"
created: ${today}
tags: [context, schedule, global]
---

# Schedule

Time-blocked events and appointments.
`);

        // Create .gitignore
        const gitignore = `.state.json
.DS_Store
`;
        try {
            await fs.access(path.join(cwd, '.gitignore'));
            await fs.appendFile(path.join(cwd, '.gitignore'), '\n' + gitignore);
        } catch (err) {
            debug('init', err);
            await fs.writeFile(path.join(cwd, '.gitignore'), gitignore);
        }

        // ── User setup ─────────────────────────────────────────────────
        console.log(chalk.green('\n✓ Vault structure created!'));
        console.log(chalk.cyan('\n🧝 Dobbie would like to get to know you...\n'));

        const { userName, gender } = await inquirer.prompt([
            {
                type: 'input',
                name: 'userName',
                message: 'What should Dobbie call you?',
                default: process.env.USER || 'friend',
            },
            {
                type: 'list',
                name: 'gender',
                message: 'How should Dobbie address you?',
                choices: [
                    { name: 'Male   — sir, boss, master, chief, captain, guv, my lord, good sir', value: 'male' },
                    { name: 'Female — ma\'am, miss, madam, my lady, boss, chief, mistress', value: 'female' },
                    { name: 'Other  — boss, chief, captain, friend, guv, my liege, comrade', value: 'other' },
                ],
            },
        ]);

        const state = await loadState();
        state.userName = userName;
        state.gender = gender;
        await saveState(state);

        // Refresh the response cache so the greeting uses the new name
        await refreshResponseCache();

        console.log(chalk.gray(`\nCreated:`));
        console.log(chalk.gray(`  .socks.md           - Root context`));
        console.log(chalk.gray(`  projects/           - Your projects`));
        console.log(chalk.gray(`  global/todos/       - Cross-project todos`));
        console.log(chalk.gray(`  global/schedule/    - Calendar/schedule`));
        console.log(chalk.cyan(`\n${getResponse('greeting')}`));
    });

export default initCommand;
