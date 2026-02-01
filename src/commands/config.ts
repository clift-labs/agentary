import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
    loadConfig,
    loadSecrets,
    setApiKey,
    setTaskModel,
    getApiKey,
} from '../config.js';
import { listProviders } from '../llm/providers/index.js';

export const configCommand = new Command('config')
    .description('Manage configuration and secrets');

// Default action - show config
configCommand
    .action(async () => {
        const config = await loadConfig();
        const secrets = await loadSecrets();

        console.log(chalk.cyan('\n⚙️  Dobbie Configuration\n'));

        console.log(chalk.bold('Default Provider:'), config.defaultProvider);
        console.log('');

        console.log(chalk.bold('Task → Model Mapping:'));
        for (const [task, mapping] of Object.entries(config.taskModelMapping)) {
            const m = mapping as { provider: string; model: string };
            console.log(chalk.gray(`  ${task}: ${m.provider}/${m.model}`));
        }
        console.log('');

        console.log(chalk.bold('Configured Providers:'));
        const providers = Object.keys(secrets.providers);
        if (providers.length === 0) {
            console.log(chalk.yellow('  No providers configured. Run `dobbie config add-provider <name>`'));
        } else {
            for (const provider of providers) {
                console.log(chalk.green(`  ✓ ${provider}`));
            }
        }
        console.log('');
    });

// Add provider
configCommand
    .command('add-provider <name>')
    .description('Add or update an LLM provider API key')
    .action(async (name: string) => {
        console.log(chalk.cyan(`\nConfiguring ${name} provider, sir.\n`));

        const existing = await getApiKey(name);
        if (existing) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `API key for ${name} already exists. Replace it?`,
                    default: false,
                },
            ]);
            if (!confirm) {
                console.log(chalk.gray('Cancelled.'));
                return;
            }
        }

        const { apiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: `Enter API key for ${name}:`,
                mask: '*',
                validate: (input: string) => input.length > 0 || 'API key is required',
            },
        ]);

        await setApiKey(name, apiKey);
        console.log(chalk.green(`\n✓ API key for ${name} saved, sir!`));
    });

// Set model mapping
configCommand
    .command('set-model <task> <provider> <model>')
    .description('Set which model to use for a task')
    .action(async (task: string, provider: string, model: string) => {
        await setTaskModel(task, provider, model);
        console.log(chalk.green(`✓ Task "${task}" will now use ${provider}/${model}, sir!`));
    });

// List models
configCommand
    .command('list-providers')
    .description('List available providers')
    .action(async () => {
        const providers = listProviders();
        const secrets = await loadSecrets();

        console.log(chalk.cyan('\n📡 Available Providers:\n'));

        for (const provider of providers) {
            const configured = secrets.providers[provider] ? chalk.green('✓') : chalk.gray('○');
            console.log(`  ${configured} ${provider}`);
        }
        console.log('');
    });

export default configCommand;
