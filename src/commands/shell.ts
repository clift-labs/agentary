import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import { spawn } from 'child_process';
import { listServiceTools } from '../tools/index.js';
import { getResponse, getResponseWith } from '../responses.js';
import { StatusBar } from '../shell/tui.js';
import { StatusPoller } from '../shell/status-poller.js';
import { breadcrumbPrompt } from '../ui/breadcrumb.js';
import { isInterviewComplete } from '../state/manager.js';
import { runInterview } from './interview.js';
import { getEntityIndex } from '../entities/entity-index.js';
import type { EntityTypeName } from '../entities/entity.js';
import { feralChat } from './chat.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND TREE (for tab-completion)
// ─────────────────────────────────────────────────────────────────────────────

const COMMAND_TREE: Record<string, string[]> = {
    init: [],
    today: [],
    remember: ['-g'],
    project: ['list', 'switch', 'new'],
    config: ['add-provider', 'set-capability', 'list-capabilities', 'list-providers', 'set-name'],
    sync: [],
    week: ['--next'],
    note: ['list', 'remove'],
    todo: ['list', 'done', 'remove'],
    event: ['list', 'remove'],
    research: ['list'],
    goal: ['list'],
    todont: ['list', 'remove'],
    time: [],
    recurrence: ['create', 'list', 'edit', 'delete', 'remove', 'generate'],
    person: ['list', 'edit', 'delete', 'remove'],
    inbox: ['add'],
    service: ['start', 'stop', 'status'],
    queue: ['size', 'status', 'clear', 'pause', 'resume'],
    index: ['stats', 'graph', 'neighbors', 'rebuild'],
    tools: [],
    tool: [],    // dynamically completed with tool names
    feral: ['nodes', 'catalog', 'process'],
    interview: [],
    setup: [],
    shell: [],
    help: [],
    clear: [],
    exit: [],
};

const TOP_LEVEL_COMMANDS = Object.keys(COMMAND_TREE);

// ── Entity completion mapping ───────────────────────────────────────────
// Maps (command, subcommand) → entity type for tab completion.
// When subcommand is '*', any subcommand (or no subcommand) at arg 2+ triggers completion.

interface EntityCompletion {
    command: string;
    subcommand: string | null;  // null = complete at arg position 2 (directly after command)
    entityType: EntityTypeName;
}

const ENTITY_COMPLETIONS: EntityCompletion[] = [
    { command: 'todo', subcommand: 'done', entityType: 'task' },
    { command: 'todo', subcommand: 'remove', entityType: 'task' },
    { command: 'todo', subcommand: null, entityType: 'task' },
    { command: 'note', subcommand: 'remove', entityType: 'note' },
    { command: 'note', subcommand: null, entityType: 'note' },
    { command: 'event', subcommand: 'remove', entityType: 'event' },
    { command: 'event', subcommand: null, entityType: 'event' },
    { command: 'person', subcommand: 'edit', entityType: 'person' },
    { command: 'person', subcommand: 'delete', entityType: 'person' },
    { command: 'person', subcommand: 'remove', entityType: 'person' },
    { command: 'recurrence', subcommand: 'edit', entityType: 'recurrence' },
    { command: 'recurrence', subcommand: 'delete', entityType: 'recurrence' },
    { command: 'recurrence', subcommand: 'remove', entityType: 'recurrence' },
    { command: 'todont', subcommand: 'remove', entityType: 'todont' },
    { command: 'todont', subcommand: null, entityType: 'todont' },
    { command: 'index', subcommand: 'neighbors', entityType: 'task' },
];

function getEntityNames(entityType: EntityTypeName): string[] {
    const index = getEntityIndex();
    if (!index.isBuilt) return [];
    return index.getNodes(entityType).map(n => n.id);
}

/**
 * Build a completer function for readline.
 */
function buildCompleter(): (line: string) => [string[], string] {
    return (line: string): [string[], string] => {
        const trimmed = line.trimStart();
        const parts = trimmed.split(/\s+/);

        if (parts.length <= 1) {
            const partial = parts[0] || '';
            const hits = TOP_LEVEL_COMMANDS.filter(c => c.startsWith(partial));
            return [hits.map(h => h + ' '), partial];
        }

        const command = parts[0];
        const partial = parts[parts.length - 1] || '';

        if (command === 'tool') {
            if (parts.length === 2) {
                const toolNames = listServiceTools().map(t => t.name);
                const hits = toolNames.filter(t => t.startsWith(partial));
                return [hits.map(h => h + ' '), partial];
            }
            return [[], partial];
        }

        // Subcommand completion (arg position 2)
        const subcommands = COMMAND_TREE[command];
        if (subcommands && subcommands.length > 0 && parts.length === 2) {
            // Mix subcommands with entity names where applicable
            const hits = subcommands.filter(s => s.startsWith(partial));

            // Also complete entity names at arg 2 for commands with null subcommand
            const directCompletion = ENTITY_COMPLETIONS.find(
                ec => ec.command === command && ec.subcommand === null,
            );
            if (directCompletion) {
                const names = getEntityNames(directCompletion.entityType);
                hits.push(...names.filter(n => n.startsWith(partial) && !hits.includes(n)));
            }

            return [hits.map(h => h + ' '), partial];
        }

        // Entity name completion at arg position 3+ (after subcommand)
        if (parts.length >= 3) {
            const sub = parts[1];
            const completion = ENTITY_COMPLETIONS.find(
                ec => ec.command === command && ec.subcommand === sub,
            );
            if (completion) {
                const names = getEntityNames(completion.entityType);
                const hits = names.filter(n => n.startsWith(partial));
                return [hits.map(h => h + ' '), partial];
            }
        }

        return [[], partial];
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a dobbie command in a subprocess.
 *
 * This completely isolates Commander from readline — the child process has its
 * own stdin/stdout and can never interfere with the shell's character echo.
 */
function runCommand(args: string[]): Promise<'continue' | 'quit'> {
    return new Promise((resolve) => {
        // Spawn dobbie as a subprocess: node <script> <args...>
        const child = spawn(process.argv[0], [process.argv[1], ...args], {
            stdio: 'inherit',
            cwd: process.cwd(),
            env: process.env,
        });

        child.on('close', (code) => resolve(code === 42 ? 'quit' : 'continue'));
        child.on('error', (err) => {
            console.log(chalk.red(`Failed to run command: ${err.message}`));
            resolve('continue');
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL COMMAND
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper: print status bar then show prompt.
 */
function showPrompt(rl: readline.Interface, bar: StatusBar): void {
    bar.print();
    rl.prompt();
}

export function createShellCommand(_program: Command): Command {
    return new Command('shell')
        .alias('sh')
        .description('Start interactive shell mode with tab-completion')
        .action(async () => {
            const bar = new StatusBar();
            const poller = new StatusPoller(bar);

            // Start background polling (updates bar data silently)
            poller.start();

            // Build entity index for tab-completion (fire-and-forget)
            const entityIndex = getEntityIndex();
            entityIndex.build().catch(() => { /* silent — index is optional for completions */ });

            await bar.printWelcome();

            // First-run interview
            const interviewed = await isInterviewComplete();
            if (!interviewed) {
                await runInterview();
            }

            const prompt = breadcrumbPrompt();

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                completer: buildCompleter(),
                prompt,
                terminal: true,
            });

            // Show initial status + prompt
            showPrompt(rl, bar);

            rl.on('line', (line: string) => {
                const handleLine = async () => {
                    const input = line.trim();

                    if (!input) {
                        showPrompt(rl, bar);
                        return;
                    }

                    // Built-in shell commands
                    if (input === 'exit' || input === 'quit') {
                        poller.stop();
                        const msg = getResponse('farewell');
                        console.log(chalk.cyan(`\n${msg}\n`));
                        process.exit(0);
                        return; // unreachable, but makes intent clear
                    }

                    if (input === 'clear') {
                        console.clear();
                        showPrompt(rl, bar);
                        return;
                    }

                    if (input === 'help') {
                        printShellHelp();
                        showPrompt(rl, bar);
                        return;
                    }

                    // Dispatch via subprocess — keeps readline completely isolated
                    const args = input.split(/\s+/);

                    // Unknown command? Show a witty message + available commands
                    const command = args[0];
                    if (command && !TOP_LEVEL_COMMANDS.includes(command)) {
                        if (args.length >= 3) {
                            // 3+ words that don't match a command → autonomous chat
                            rl.pause();
                            try {
                                await feralChat(input);
                            } finally {
                                // Restore raw mode and resume readline
                                if (process.stdin.isTTY) process.stdin.setRawMode(true);
                                rl.resume();
                            }
                            await poller.pollNow();
                            console.log('');
                            showPrompt(rl, bar);
                            return;
                        }
                        const msg = getResponseWith('unknown_command', { command });
                        console.log(chalk.yellow(`\n  ${msg}`));
                        printShellHelp();
                        showPrompt(rl, bar);
                        return;
                    }

                    rl.pause();
                    const result = await runCommand(args);
                    rl.resume();

                    if (result === 'quit') {
                        poller.stop();
                        rl.close();
                        return;
                    }

                    // Refresh status bar data immediately (command may have
                    // started/stopped the service or changed queue state).
                    await poller.pollNow();

                    console.log('');
                    showPrompt(rl, bar);
                };

                handleLine().catch((err) => {
                    console.log(chalk.red(`Unexpected error: ${err instanceof Error ? err.message : err}`));
                    showPrompt(rl, bar);
                });
            });

            // Ctrl+D closes the readline — show farewell and exit
            rl.on('close', async () => {
                poller.stop();
                const msg = getResponse('farewell');
                console.log(chalk.cyan(`\n${msg}\n`));
                process.exit(0);
            });

            // Handle Ctrl+C — don't exit, just clear the line
            rl.on('SIGINT', () => {
                process.stdout.write('\n');
                showPrompt(rl, bar);
            });

            // Keep the process alive
            await new Promise<void>(() => { });
        });
}

function printShellHelp(): void {
    console.log(chalk.cyan(`
${chalk.bold('Available Commands:')}

  ${chalk.bold('Vault:')}      init, sync, today, week [--next], time
  ${chalk.bold('Projects:')}   project [list|switch|new]
  ${chalk.bold('Memory:')}     note, todo, task, event, goal, research, recurrence, person, inbox [add], remember
  ${chalk.bold('Index:')}      index [stats|graph|neighbors|rebuild]
  ${chalk.bold('Config:')}     config [add-provider|set-capability|list-capabilities|list-providers|set-name]
  ${chalk.bold('Service:')}    service [start|stop|status]
  ${chalk.bold('Queue:')}      queue [size|status|clear|pause|resume]
  ${chalk.bold('Tools:')}      tools, tool <name>
  ${chalk.bold('Feral:')}      feral [nodes|catalog|process]
  ${chalk.bold('Other:')}      interview, setup
  ${chalk.bold('Shell:')}      help, clear, exit
`));
}
