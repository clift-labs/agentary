import { Command } from 'commander';
import chalk from 'chalk';
import { startDaemon, stopDaemon, getDaemonStatus } from '../service/daemon.js';
import { getServiceClient } from '../client/index.js';
import { getResponse } from '../responses.js';

/**
 * Service management commands.
 */
export const serviceCommand = new Command('service')
    .description('Manage the Dobbie background service');

// dobbie service start
serviceCommand
    .command('start')
    .description('Start the Dobbie background service')
    .action(async () => {
        console.log(chalk.cyan('Starting Dobbie service...'));

        try {
            const status = await startDaemon();

            if (status.running) {
                console.log(chalk.green('✓ Dobbie service is running'));
                console.log(chalk.dim(`  PID: ${status.pid}`));
                console.log(chalk.dim(`  Socket: ${status.socketPath}`));
            } else {
                console.log(chalk.red('✗ Failed to start service'));
            }
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error);
        }
    });

// dobbie service stop
serviceCommand
    .command('stop')
    .description('Stop the Dobbie background service')
    .action(async () => {
        console.log(chalk.cyan('Stopping Dobbie service...'));

        try {
            const status = await stopDaemon();

            if (!status.running) {
                console.log(chalk.green('✓ Dobbie service stopped'));
            } else {
                console.log(chalk.red('✗ Failed to stop service'));
            }
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error);
        }
    });

// dobbie service status
serviceCommand
    .command('status')
    .description('Check the status of the Dobbie service')
    .action(async () => {
        try {
            const status = await getDaemonStatus();

            if (status.running) {
                console.log(chalk.green('✓ Dobbie service is running'));
                console.log(chalk.dim(`  PID: ${status.pid}`));
                console.log(chalk.dim(`  Socket: ${status.socketPath}`));
            } else {
                console.log(chalk.yellow('○ Dobbie service is not running'));
                console.log(chalk.dim('  Start with: dobbie service start'));
            }
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error);
        }
    });

/**
 * Queue management commands.
 */
export const queueCommand = new Command('queue')
    .description('Manage the task queue');

// dobbie queue size
queueCommand
    .command('size')
    .description('Get the current queue size')
    .action(async () => {
        try {
            const client = getServiceClient();
            await client.connect();

            const size = await client.getQueueSize();
            console.log(chalk.cyan(`Queue size: ${size}`));

            client.disconnect();
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error instanceof Error ? error.message : error);
        }
    });

// dobbie queue status
queueCommand
    .command('status')
    .description('Get detailed queue status')
    .action(async () => {
        try {
            const client = getServiceClient();
            await client.connect();

            const response = await client.getQueueStatus();
            const status = response.result as {
                size: number;
                maxSize: number;
                isFull: boolean;
                processing: number;
                pending: number;
                completedCount: number;
                errorCount: number;
            };

            console.log(chalk.cyan('Queue Status:'));
            console.log(`  Size: ${status.size}/${status.maxSize}${status.isFull ? chalk.red(' (FULL)') : ''}`);
            console.log(`  Processing: ${status.processing}`);
            console.log(`  Pending: ${status.pending}`);
            console.log(`  Completed: ${chalk.green(status.completedCount.toString())}`);
            console.log(`  Errors: ${status.errorCount > 0 ? chalk.red(status.errorCount.toString()) : '0'}`);

            client.disconnect();
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error instanceof Error ? error.message : error);
        }
    });

// dobbie queue clear
queueCommand
    .command('clear')
    .description('Clear all pending tasks from the queue')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (options) => {
        if (!options.yes) {
            console.log(chalk.yellow('Use --yes to confirm clearing the queue'));
            return;
        }

        try {
            const client = getServiceClient();
            await client.connect();

            const response = await client.clearQueue();
            const cleared = (response.result as { cleared: number }).cleared;

            console.log(chalk.green(`✓ Cleared ${cleared} tasks from queue`));

            client.disconnect();
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error instanceof Error ? error.message : error);
        }
    });

// dobbie queue pause
queueCommand
    .command('pause')
    .description('Pause queue processing')
    .action(async () => {
        try {
            const client = getServiceClient();
            await client.connect();

            await client.pauseQueue();
            console.log(chalk.yellow('⏸ Queue processing paused'));

            client.disconnect();
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error instanceof Error ? error.message : error);
        }
    });

// dobbie queue resume
queueCommand
    .command('resume')
    .description('Resume queue processing')
    .action(async () => {
        try {
            const client = getServiceClient();
            await client.connect();

            await client.resumeQueue();
            console.log(chalk.green('▶ Queue processing resumed'));

            client.disconnect();
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error instanceof Error ? error.message : error);
        }
    });
