import { Command } from 'commander';
import { listEntities } from './list.js';

export const researchCommand = new Command('research')
    .description('Research management')
    .argument('[action]', 'Action to perform (list)')
    .action(async (action?: string) => {
        if (!action || action === 'list') {
            await listEntities('research');
            return;
        }

        console.log(`Unknown action: ${action}. Available: list`);
    });

export default researchCommand;
