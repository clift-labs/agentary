import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { requireProject, getVaultRoot } from '../state/manager.js';
import {
    slugify,
    ensureEntityDir,
    getEntityDir,
    trashEntity,
    type RecurrenceCadence,
    type RecurrenceTargetType,
    type BlackoutWindow,
    type CadenceDetails,
} from '../entities/entity.js';
import { listEntities as listEntitiesDisplay } from './list.js';
import { getResponse } from '../responses.js';
import { debug } from '../utils/debug.js';
import { getEntityIndex } from '../entities/entity-index.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface RecurrenceState {
    title: string;
    project: string;
    recurrenceType: RecurrenceTargetType;
    cadence: RecurrenceCadence;
    cadenceDetails: CadenceDetails;
    priority?: string;
    blackoutWindows: BlackoutWindow[];
    body: string;
    filepath?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE I/O
// ─────────────────────────────────────────────────────────────────────────────

async function saveRecurrence(state: RecurrenceState): Promise<string> {
    const dir = await ensureEntityDir('recurrence');

    let filepath = state.filepath;
    if (!filepath) {
        filepath = path.join(dir, slugify(state.title) + '.md');
    }

    const meta: Record<string, unknown> = {
        title: state.title,
        entityType: 'recurrence',
        recurrenceType: state.recurrenceType,
        cadence: state.cadence,
        cadenceDetails: state.cadenceDetails,
        project: state.project,
        tags: ['recurrence'],
        created: new Date().toISOString(),
    };
    if (state.priority) meta.priority = state.priority;
    if (state.blackoutWindows.length > 0) meta.blackoutWindows = state.blackoutWindows;

    const fileContent = matter.stringify(state.body, meta);
    await fs.writeFile(filepath, fileContent);

    // Update entity index
    const index = getEntityIndex();
    if (index.isBuilt) {
        const slug = path.basename(filepath, '.md');
        await index.addOrUpdate('recurrence', slug, state.title, filepath);
    }

    return filepath;
}

async function loadAllRecurrences(project: string): Promise<RecurrenceState[]> {
    const vaultRoot = await getVaultRoot();
    const dir = path.join(vaultRoot, 'projects', project, 'recurrences');

    let files: string[];
    try {
        files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
    } catch {
        return [];
    }

    const recurrences: RecurrenceState[] = [];
    for (const file of files) {
        const filepath = path.join(dir, file);
        const raw = await fs.readFile(filepath, 'utf-8');
        const { data, content } = matter(raw);
        recurrences.push({
            title: data.title ?? file.replace('.md', ''),
            project,
            recurrenceType: data.recurrenceType ?? 'todo',
            cadence: data.cadence ?? 'monthly',
            cadenceDetails: data.cadenceDetails ?? {},
            priority: data.priority,
            blackoutWindows: data.blackoutWindows ?? [],
            body: content.trim(),
            filepath,
        });
    }
    return recurrences;
}

async function findRecurrence(project: string, name: string): Promise<RecurrenceState | null> {
    const all = await loadAllRecurrences(project);
    const slug = slugify(name);
    return all.find(r =>
        slugify(r.title) === slug ||
        r.title.toLowerCase() === name.toLowerCase(),
    ) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Compute all occurrence dates for a recurrence within [start, end].
 */
function computeOccurrences(
    cadence: RecurrenceCadence,
    details: CadenceDetails,
    start: Date,
    end: Date,
): Date[] {
    const dates: Date[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    switch (cadence) {
        case 'daily': {
            while (cursor <= end) {
                dates.push(new Date(cursor));
                cursor.setDate(cursor.getDate() + 1);
            }
            break;
        }
        case 'weekly': {
            const targetDay = DAYS_OF_WEEK.indexOf((details.dayOfWeek ?? 'monday').toLowerCase());
            // Advance cursor to the first occurrence of targetDay
            while (cursor.getDay() !== targetDay && cursor <= end) {
                cursor.setDate(cursor.getDate() + 1);
            }
            while (cursor <= end) {
                dates.push(new Date(cursor));
                cursor.setDate(cursor.getDate() + 7);
            }
            break;
        }
        case 'monthly': {
            const targetDom = details.dayOfMonth ?? 1;
            // Start with the month of `start`
            cursor.setDate(targetDom);
            if (cursor < start) {
                cursor.setMonth(cursor.getMonth() + 1);
                cursor.setDate(targetDom);
            }
            while (cursor <= end) {
                dates.push(new Date(cursor));
                cursor.setMonth(cursor.getMonth() + 1);
                cursor.setDate(targetDom);
            }
            break;
        }
    }
    return dates;
}

/**
 * Check if a date falls inside any blackout window.
 */
function isBlackedOut(date: Date, windows: BlackoutWindow[]): boolean {
    const d = formatDate(date);
    return windows.some(w => d >= w.start && d <= w.end);
}

function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE CONCRETE ENTITIES
// ─────────────────────────────────────────────────────────────────────────────

async function generateConcreteEntities(project: string, days: number): Promise<void> {
    const recurrences = await loadAllRecurrences(project);
    if (recurrences.length === 0) {
        console.log(chalk.gray('\nNo recurrences found. Create one with "recurrence create".'));
        return;
    }

    const vaultRoot = await getVaultRoot();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const rec of recurrences) {
        const occurrences = computeOccurrences(rec.cadence, rec.cadenceDetails, today, endDate);
        const targetDir = rec.recurrenceType === 'todo'
            ? path.join(vaultRoot, 'projects', project, 'todos')
            : path.join(vaultRoot, 'projects', project, 'events');

        await fs.mkdir(targetDir, { recursive: true });

        // Load existing entities to check for duplicates
        const existingFiles = await safeReaddir(targetDir);
        const existingMetas = await Promise.all(
            existingFiles.filter(f => f.endsWith('.md')).map(async f => {
                const raw = await fs.readFile(path.join(targetDir, f), 'utf-8');
                return matter(raw).data;
            }),
        );

        for (const date of occurrences) {
            if (isBlackedOut(date, rec.blackoutWindows)) {
                totalSkipped++;
                continue;
            }

            const dateStr = formatDate(date);
            const concreteTitle = `${rec.title} — ${dateStr}`;

            // Idempotency: check if already exists
            const alreadyExists = existingMetas.some(m =>
                m.recurrenceTitle === rec.title && m.recurrenceDate === dateStr,
            );
            if (alreadyExists) {
                totalSkipped++;
                continue;
            }

            // Create the concrete entity
            const filename = slugify(concreteTitle) + '.md';
            const filepath = path.join(targetDir, filename);

            let meta: Record<string, unknown>;
            if (rec.recurrenceType === 'todo') {
                meta = {
                    title: concreteTitle,
                    entityType: 'task',
                    created: new Date().toISOString(),
                    project,
                    priority: rec.priority ?? 'medium',
                    completed: false,
                    dueDate: dateStr,
                    tags: ['todo', 'recurring'],
                    recurrenceTitle: rec.title,
                    recurrenceDate: dateStr,
                };
            } else {
                // Event — attach start/end times using the date + time from cadenceDetails
                const startTime = rec.cadenceDetails.startTime ?? '09:00';
                const endTime = rec.cadenceDetails.endTime ?? '10:00';
                meta = {
                    title: concreteTitle,
                    entityType: 'event',
                    created: new Date().toISOString(),
                    project,
                    startTime: `${dateStr}T${startTime}:00`,
                    endTime: `${dateStr}T${endTime}:00`,
                    location: rec.cadenceDetails.location ?? '',
                    tags: ['event', 'recurring'],
                    recurrenceTitle: rec.title,
                    recurrenceDate: dateStr,
                };
            }

            const fileContent = matter.stringify(rec.body, meta);
            await fs.writeFile(filepath, fileContent);

            // Update entity index for generated entity
            const index = getEntityIndex();
            if (index.isBuilt) {
                const entityType = rec.recurrenceType === 'todo' ? 'task' : 'event';
                const slug = path.basename(filepath, '.md');
                await index.addOrUpdate(entityType as any, slug, concreteTitle, filepath);
            }

            totalCreated++;
        }
    }

    console.log(chalk.green(`\n✓ Generated ${totalCreated} concrete entities (${totalSkipped} skipped/blacked-out)`));
}

async function safeReaddir(dir: string): Promise<string[]> {
    try {
        return await fs.readdir(dir);
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE CREATE
// ─────────────────────────────────────────────────────────────────────────────

async function interactiveCreate(project: string): Promise<void> {
    const { title } = await inquirer.prompt([{
        type: 'input',
        name: 'title',
        message: 'Recurrence name (e.g. "Pay rent"):',
        validate: (i: string) => i.length > 0 || 'Title is required',
    }]);

    const { recurrenceType } = await inquirer.prompt([{
        type: 'list',
        name: 'recurrenceType',
        message: 'What type of entity does this create?',
        choices: [
            { name: 'Todo — recurring task', value: 'todo' },
            { name: 'Event — recurring event with times', value: 'event' },
        ],
    }]);

    const { cadence } = await inquirer.prompt([{
        type: 'list',
        name: 'cadence',
        message: 'How often does it repeat?',
        choices: [
            { name: 'Daily', value: 'daily' },
            { name: 'Weekly', value: 'weekly' },
            { name: 'Monthly', value: 'monthly' },
        ],
    }]);

    const cadenceDetails: CadenceDetails = {};

    if (cadence === 'weekly') {
        const { dayOfWeek } = await inquirer.prompt([{
            type: 'list',
            name: 'dayOfWeek',
            message: 'Which day of the week?',
            choices: DAYS_OF_WEEK.map(d => ({ name: d.charAt(0).toUpperCase() + d.slice(1), value: d })),
        }]);
        cadenceDetails.dayOfWeek = dayOfWeek;
    }

    if (cadence === 'monthly') {
        const { dayOfMonth } = await inquirer.prompt([{
            type: 'input',
            name: 'dayOfMonth',
            message: 'Day of month (1-31):',
            default: '1',
            validate: (i: string) => {
                const n = parseInt(i);
                return (n >= 1 && n <= 31) || 'Enter a day between 1 and 31';
            },
        }]);
        cadenceDetails.dayOfMonth = parseInt(dayOfMonth);
    }

    let priority: string | undefined;
    if (recurrenceType === 'todo') {
        const { p } = await inquirer.prompt([{
            type: 'list',
            name: 'p',
            message: 'Default priority for generated todos?',
            choices: ['low', 'medium', 'high'],
            default: 'medium',
        }]);
        priority = p;
    }

    if (recurrenceType === 'event') {
        const { startTime } = await inquirer.prompt([{
            type: 'input',
            name: 'startTime',
            message: 'Start time (HH:mm):',
            default: '09:00',
            validate: (i: string) => /^\d{2}:\d{2}$/.test(i) || 'Use HH:mm format',
        }]);
        const { endTime } = await inquirer.prompt([{
            type: 'input',
            name: 'endTime',
            message: 'End time (HH:mm):',
            default: '10:00',
            validate: (i: string) => /^\d{2}:\d{2}$/.test(i) || 'Use HH:mm format',
        }]);
        cadenceDetails.startTime = startTime;
        cadenceDetails.endTime = endTime;

        const { location } = await inquirer.prompt([{
            type: 'input',
            name: 'location',
            message: 'Location (optional):',
        }]);
        if (location) cadenceDetails.location = location;
    }

    // ── Blackout windows ───────────────────────────────────────────────
    const blackoutWindows: BlackoutWindow[] = [];
    let addingBlackouts = true;
    const { wantBlackouts } = await inquirer.prompt([{
        type: 'confirm',
        name: 'wantBlackouts',
        message: 'Add blackout windows (dates to skip)?',
        default: false,
    }]);

    if (wantBlackouts) {
        while (addingBlackouts) {
            const { start } = await inquirer.prompt([{
                type: 'input',
                name: 'start',
                message: 'Blackout start date (YYYY-MM-DD):',
                validate: (i: string) => /^\d{4}-\d{2}-\d{2}$/.test(i) || 'Use YYYY-MM-DD',
            }]);
            const { end } = await inquirer.prompt([{
                type: 'input',
                name: 'end',
                message: 'Blackout end date (YYYY-MM-DD):',
                default: start,
                validate: (i: string) => /^\d{4}-\d{2}-\d{2}$/.test(i) || 'Use YYYY-MM-DD',
            }]);
            const { reason } = await inquirer.prompt([{
                type: 'input',
                name: 'reason',
                message: 'Reason (optional):',
            }]);

            blackoutWindows.push({ start, end, reason: reason || undefined });

            const { more } = await inquirer.prompt([{
                type: 'confirm',
                name: 'more',
                message: 'Add another blackout window?',
                default: false,
            }]);
            addingBlackouts = more;
        }
    }

    // ── Body ───────────────────────────────────────────────────────────
    const { body } = await inquirer.prompt([{
        type: 'editor',
        name: 'body',
        message: 'Template body (copied into each concrete entity):',
    }]);

    const state: RecurrenceState = {
        title,
        project,
        recurrenceType,
        cadence,
        cadenceDetails,
        priority,
        blackoutWindows,
        body: body.trim(),
    };

    const filepath = await saveRecurrence(state);
    console.log(chalk.green(`\n✓ Recurrence "${title}" saved → ${filepath}`));
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────────────────────────────────────

async function editRecurrence(project: string, name: string): Promise<void> {
    const rec = await findRecurrence(project, name);
    if (!rec) {
        console.log(chalk.red(`\nRecurrence "${name}" not found.`));
        return;
    }

    console.log(chalk.cyan(`\nEditing recurrence: "${rec.title}"`));

    const { field } = await inquirer.prompt([{
        type: 'list',
        name: 'field',
        message: 'What would you like to edit?',
        choices: [
            { name: 'Title', value: 'title' },
            { name: 'Body (template content)', value: 'body' },
            { name: 'Priority', value: 'priority' },
            { name: 'Blackout windows', value: 'blackouts' },
        ],
    }]);

    switch (field) {
        case 'title': {
            const { newTitle } = await inquirer.prompt([{
                type: 'input', name: 'newTitle', message: 'New title:', default: rec.title,
            }]);
            rec.title = newTitle;
            break;
        }
        case 'body': {
            const { newBody } = await inquirer.prompt([{
                type: 'editor', name: 'newBody', message: 'Edit body:', default: rec.body,
            }]);
            rec.body = newBody.trim();
            break;
        }
        case 'priority': {
            const { newPriority } = await inquirer.prompt([{
                type: 'list', name: 'newPriority', message: 'Priority:',
                choices: ['low', 'medium', 'high'], default: rec.priority ?? 'medium',
            }]);
            rec.priority = newPriority;
            break;
        }
        case 'blackouts': {
            console.log(chalk.gray(`\nCurrent blackout windows: ${rec.blackoutWindows.length}`));
            rec.blackoutWindows.forEach((w, i) => {
                console.log(chalk.gray(`  ${i + 1}. ${w.start} → ${w.end}${w.reason ? ` (${w.reason})` : ''}`));
            });
            const { action } = await inquirer.prompt([{
                type: 'list', name: 'action', message: 'Action:',
                choices: [
                    { name: 'Add a window', value: 'add' },
                    { name: 'Clear all windows', value: 'clear' },
                    { name: 'Cancel', value: 'cancel' },
                ],
            }]);
            if (action === 'add') {
                const { start } = await inquirer.prompt([{
                    type: 'input', name: 'start', message: 'Start (YYYY-MM-DD):',
                    validate: (i: string) => /^\d{4}-\d{2}-\d{2}$/.test(i) || 'Use YYYY-MM-DD',
                }]);
                const { end } = await inquirer.prompt([{
                    type: 'input', name: 'end', message: 'End (YYYY-MM-DD):', default: start,
                    validate: (i: string) => /^\d{4}-\d{2}-\d{2}$/.test(i) || 'Use YYYY-MM-DD',
                }]);
                const { reason } = await inquirer.prompt([{
                    type: 'input', name: 'reason', message: 'Reason (optional):',
                }]);
                rec.blackoutWindows.push({ start, end, reason: reason || undefined });
            } else if (action === 'clear') {
                rec.blackoutWindows = [];
            }
            break;
        }
    }

    await saveRecurrence(rec);
    console.log(chalk.green(`✓ Recurrence "${rec.title}" updated.`));
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

async function deleteRecurrence(project: string, name: string): Promise<void> {
    const rec = await findRecurrence(project, name);
    if (!rec) {
        console.log(chalk.red(`\nRecurrence "${name}" not found.`));
        return;
    }

    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Delete recurrence "${rec.title}"?`,
        default: false,
    }]);

    if (confirm && rec.filepath) {
        const trashPath = await trashEntity(rec.filepath);

        // Update entity index
        const index = getEntityIndex();
        if (index.isBuilt) {
            const slug = path.basename(rec.filepath, '.md');
            index.remove('recurrence', slug);
        }

        console.log(chalk.green(`🗑  Moved to trash: ${rec.title}`));
        console.log(chalk.gray(`  ${trashPath}`));
    } else {
        console.log(chalk.gray('Cancelled.'));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND
// ─────────────────────────────────────────────────────────────────────────────

export const recurrenceCommand = new Command('recurrence')
    .description('Manage recurring todos and events')
    .argument('[action]', 'create | list | edit | delete | generate')
    .argument('[args...]', 'Name for edit/delete, or days for generate')
    .action(async (action?: string, args?: string[]) => {
        try {
            const project = await requireProject();

            switch (action) {
                case 'create':
                    await interactiveCreate(project);
                    break;

                case 'list':
                    await listEntitiesDisplay('recurrences');
                    break;

                case 'edit': {
                    const name = args?.join(' ');
                    if (!name) {
                        console.log(chalk.yellow('Usage: recurrence edit <name>'));
                        return;
                    }
                    await editRecurrence(project, name);
                    break;
                }

                case 'delete':
                case 'remove': {
                    const name = args?.join(' ');
                    if (!name) {
                        console.log(chalk.yellow('Usage: recurrence delete <name>'));
                        return;
                    }
                    await deleteRecurrence(project, name);
                    break;
                }

                case 'generate': {
                    const days = args?.[0] ? parseInt(args[0]) : 60;
                    if (isNaN(days) || days < 1) {
                        console.log(chalk.yellow('Provide a valid number of days (default: 60).'));
                        return;
                    }
                    console.log(chalk.gray(`\nGenerating concrete entities for the next ${days} days...`));
                    await generateConcreteEntities(project, days);
                    break;
                }

                default:
                    console.log(chalk.cyan(`\n🔄 Recurrence commands:\n`));
                    console.log(`  ${chalk.bold('create')}    - Create a new recurrence`);
                    console.log(`  ${chalk.bold('list')}      - List all recurrences`);
                    console.log(`  ${chalk.bold('edit')}      - Edit a recurrence`);
                    console.log(`  ${chalk.bold('delete')}    - Delete a recurrence`);
                    console.log(`  ${chalk.bold('generate')}  - Generate concrete entities (default: 60 days)`);
                    console.log('');
                    break;
            }
        } catch (error) {
            console.error(chalk.red(getResponse('error')), error);
        }
    });

export default recurrenceCommand;
