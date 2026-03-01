import { Command } from 'commander';
import { listEntities } from './list.js';

export const goalCommand = new Command('goal')
    .description('Goal management')
    .argument('[action]', 'Action to perform (list)')
    .action(async (action?: string) => {
        if (!action || action === 'list') {
            await listEntities('goals');
            return;
        }

        console.log(`Unknown action: ${action}. Available: list`);
    });

export default goalCommand;
