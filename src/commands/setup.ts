import { Command } from 'commander';
import { getResponse, refreshResponseCache } from '../responses.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadState, saveState, getUserName, getUserGender } from '../state/manager.js';

export const setupCommand = new Command('setup')
    .description('Update your name and how Dobbie addresses you')
    .action(async () => {
        const currentName = await getUserName();
        const currentGender = await getUserGender() || 'other';

        console.log(chalk.cyan('\n🧝 Dobbie would like to update your preferences...\n'));
        console.log(chalk.gray(`  Current name:   ${currentName}`));
        console.log(chalk.gray(`  Current gender: ${currentGender}\n`));

        const { userName, gender } = await inquirer.prompt([
            {
                type: 'input',
                name: 'userName',
                message: 'What should Dobbie call you?',
                default: currentName,
            },
            {
                type: 'list',
                name: 'gender',
                message: 'How should Dobbie address you?',
                default: currentGender,
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

        await refreshResponseCache();

        console.log(chalk.green('\n✓ Preferences updated!'));
        console.log(chalk.cyan(getResponse('greeting')));
    });

export default setupCommand;
