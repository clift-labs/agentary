/**
 * Dobbie's personality response catalog.
 * Each key maps to an array of possible responses.
 * Use getResponse(key) to get a random response with {name} and {honorific} auto-substituted.
 *
 * Placeholders:
 *   {name}      — user's name (auto-substituted by getResponse / getResponseWith)
 *   {honorific} — random honorific from gender pool (auto-substituted by getResponse / getResponseWith)
 */

export type ResponseKey =
    | 'greeting'
    | 'farewell'
    | 'task_complete'
    | 'task_saved'
    | 'task_discarded'
    | 'thinking'
    | 'processing'
    | 'error'
    | 'no_vault'
    | 'need_project'
    | 'project_created'
    | 'project_switched'
    | 'sync_start'
    | 'sync_complete'
    | 'sync_error'
    | 'note_reviewing'
    | 'note_improved'
    | 'note_questions'
    | 'note_modified'
    | 'note_formatted'
    | 'todo_breakdown'
    | 'todo_clarified'
    | 'todo_estimated'
    | 'todo_modified'
    | 'event_clarified'
    | 'event_time_suggest'
    | 'event_modified'
    | 'inbox_empty'
    | 'inbox_processing'
    | 'inbox_complete'
    | 'remember_saved'
    | 'today_summary'
    | 'config_show'
    | 'provider_added'
    | 'capability_set'
    | 'diagram_generating'
    | 'help_offer'
    | 'startup_greeting'
    | 'unknown_command';

const responses: Record<ResponseKey, string[]> = {
    greeting: [
        '🧝 Dobbie is at your service, {name}!',
        '🧝 Dobbie awaits your command, {honorific}!',
        '🧝 How may Dobbie assist you today, {name}?',
        '🧝 Dobbie is ready and eager to help, {honorific}!',
        '🧝 Dobbie is here! What does {name} require?',
        '🧝 Dobbie has been waiting, {honorific}! How can Dobbie help?',
        '🧝 Good to see you, {name}! Dobbie is at the ready!',
    ],
    farewell: [
        'Dobbie is always here if you need anything else, {name}!',
        'Dobbie hopes this was helpful, {honorific}!',
        'Dobbie will be waiting right here, {name}!',
        'Until next time, {honorific}! Dobbie is honored to serve.',
        'Dobbie bids you farewell, {name}!',
        'Call on Dobbie anytime, {honorific}!',
        'Dobbie is grateful to have helped, {name}!',
    ],
    task_complete: [
        'Dobbie has completed the task, {name}!',
        'Done, {honorific}! Dobbie hopes this pleases you.',
        'Dobbie has finished, {name}!',
        'All done, {honorific}! Dobbie worked very hard on this.',
        'Task complete, {honorific}! Dobbie is proud.',
        'Finished, {name}! Dobbie did it!',
        'Dobbie has accomplished the task, {name}!',
    ],
    task_saved: [
        'Dobbie has saved everything, {name}!',
        'Saved successfully, {honorific}!',
        'Dobbie has stored this safely, {name}!',
        'It is saved, {honorific}! Dobbie made sure of it.',
        'Safely stored, {honorific}!',
        'Dobbie has preserved it, {name}!',
        'Everything is saved, {name}! Dobbie double-checked.',
    ],
    task_discarded: [
        'Dobbie has discarded it, {honorific}.',
        'Discarded as requested, {name}.',
        'Dobbie has thrown it away, {honorific}.',
        'Gone, {name}. Dobbie has removed it.',
        'Dobbie has deleted it, {honorific}.',
        'It is no more, {name}.',
        'Dobbie has disposed of it, {honorific}.',
    ],
    thinking: [
        'Dobbie is thinking, {honorific}...',
        'One moment, {name}... Dobbie is pondering...',
        'Dobbie is considering this carefully, {honorific}...',
        'Let Dobbie think about this, {name}...',
        'Dobbie is contemplating, {honorific}...',
        'Hmm, Dobbie is working this out, {name}...',
        'Dobbie needs a moment to think, {honorific}...',
    ],
    processing: [
        'Dobbie is working on it, {honorific}...',
        'Dobbie is processing, {name}...',
        'One moment, {honorific}...',
        'Dobbie is on it, {name}...',
        'Working, {honorific}...',
        'Dobbie is handling this, {name}...',
        'Please wait, {honorific}... Dobbie is busy...',
    ],
    error: [
        'Dobbie encountered a problem, {name}.',
        'Oh no, {honorific}! Dobbie ran into an error.',
        'Dobbie is sorry, {name}. Something went wrong.',
        'Dobbie must report an error, {honorific}.',
        'Dobbie has bad news, {name}. There was an error.',
        'Something failed, {honorific}. Dobbie apologizes.',
        'Dobbie tried, {name}, but there was a problem.',
    ],
    no_vault: [
        'Dobbie cannot find a vault here, {honorific}.',
        'This directory has no vault, {name}. Dobbie cannot proceed.',
        '{honorific}, Dobbie needs a vault to work. Please run dobbie init.',
        'No vault found, {name}. Dobbie is lost without one.',
        'Dobbie requires a vault, {honorific}. This directory has none.',
        '{name}, please create a vault first with dobbie init.',
        'Dobbie looked everywhere, {honorific}, but found no vault.',
    ],
    need_project: [
        'Dobbie needs to know which project, {honorific}.',
        'Which project shall Dobbie work on, {name}?',
        'Please tell Dobbie which project, {honorific}.',
        'Dobbie requires a project to be selected, {name}.',
        '{honorific}, Dobbie needs a project to proceed.',
        'Which project, {name}? Dobbie awaits your choice.',
        'Dobbie cannot continue without knowing the project, {honorific}.',
    ],
    project_created: [
        'Dobbie has created the project, {name}!',
        'Project created successfully, {honorific}!',
        'Your new project is ready, {name}!',
        'Dobbie set up the project for you, {honorific}!',
        'The project is now ready, {name}!',
        'Dobbie has prepared everything, {honorific}!',
        'Project initialized, {name}! Ready to go!',
    ],
    project_switched: [
        'Dobbie has switched to the project, {honorific}!',
        'Now working on the project, {name}!',
        'Dobbie is ready to work on this project, {honorific}!',
        'Switched successfully, {name}!',
        'Dobbie is now focused on this project, {honorific}!',
        'Project changed, {name}! Dobbie is ready.',
        'Dobbie has moved to the new project, {honorific}!',
    ],
    sync_start: [
        'Dobbie is syncing with GitHub, {honorific}...',
        'Syncing everything now, {name}...',
        'Dobbie is pushing to GitHub, {honorific}...',
        'Starting sync, {name}...',
        'Dobbie is connecting to GitHub, {honorific}...',
        'Uploading changes, {name}...',
        'Dobbie is synchronizing, {honorific}...',
    ],
    sync_complete: [
        'Dobbie has synced everything, {name}!',
        'All synced up, {honorific}!',
        'GitHub sync complete, {name}!',
        'Everything is safely synced, {honorific}!',
        'Sync successful, {name}!',
        'Dobbie has pushed all changes, {honorific}!',
        'Your work is backed up, {name}!',
    ],
    sync_error: [
        'Dobbie had trouble syncing, {honorific}.',
        'The sync failed, {name}. Dobbie is sorry.',
        'Dobbie could not complete the sync, {honorific}.',
        'Sync encountered an error, {name}.',
        'GitHub rejected Dobbie, {honorific}. Something went wrong.',
        'Dobbie failed to push, {name}.',
        'There was a problem with the sync, {honorific}.',
    ],
    note_reviewing: [
        'Dobbie is reviewing your note, {honorific}...',
        'Let Dobbie take a look at this, {name}...',
        'Dobbie is carefully reading this, {honorific}...',
        'Reviewing now, {name}...',
        'Dobbie is examining your note, {honorific}...',
        'Dobbie is studying this carefully, {name}...',
        'Reading through it now, {honorific}...',
    ],
    note_improved: [
        'Dobbie has improved the note, {name}!',
        'The note is better now, {honorific}!',
        'Dobbie has polished it up, {name}!',
        'Note enhanced, {honorific}!',
        'Dobbie made it shine, {name}!',
        'Improvements applied, {honorific}!',
        'Dobbie has refined the note, {name}!',
    ],
    note_questions: [
        'Dobbie has some questions about this, {name}:',
        'Here are some things to consider, {honorific}:',
        'Dobbie wonders about these points, {name}:',
        'Some questions for you, {honorific}:',
        'Dobbie is curious about these things, {name}:',
        'These points need clarification, {honorific}:',
        'Dobbie would like to ask, {name}:',
    ],
    note_modified: [
        'Dobbie has modified the note, {honorific}!',
        'Changes applied, {name}!',
        'The note has been updated, {honorific}!',
        'Note modified successfully, {name}!',
        'Dobbie has made the changes, {honorific}!',
        'Updates complete, {name}!',
        'Dobbie altered the note as requested, {honorific}!',
    ],
    note_formatted: [
        'Dobbie is formatting your note as markdown, {honorific}...',
        'Making it look nice, {name}...',
        'Dobbie is tidying up the formatting, {honorific}...',
        'Formatting now, {name}...',
        'Dobbie is making it pretty, {honorific}...',
        'Applying markdown formatting, {name}...',
        'Dobbie is beautifying your note, {honorific}...',
    ],
    todo_breakdown: [
        'Dobbie is breaking down the task, {honorific}...',
        'Let Dobbie split this into smaller pieces, {name}...',
        'Dobbie is creating subtasks, {honorific}...',
        'Breaking it down now, {name}...',
        'Dobbie is dividing the work, {honorific}...',
        'Splitting into manageable parts, {name}...',
        'Dobbie is decomposing the task, {honorific}...',
    ],
    todo_clarified: [
        'Dobbie has clarified the task, {name}!',
        'The todo is clearer now, {honorific}!',
        'Dobbie has made it more specific, {name}!',
        'Task clarified, {honorific}!',
        'Dobbie improved the description, {name}!',
        'Much clearer now, {honorific}!',
        'Dobbie has sharpened the details, {name}!',
    ],
    todo_estimated: [
        'Dobbie has analyzed the effort, {honorific}.',
        'Here is Dobbie\'s estimate, {name}.',
        'Dobbie has assessed this task, {honorific}.',
        'Estimation complete, {name}.',
        'Dobbie calculated the effort, {honorific}.',
        'Here\'s what Dobbie thinks it will take, {name}.',
        'Dobbie has evaluated the complexity, {honorific}.',
    ],
    todo_modified: [
        'Dobbie has modified the todo, {name}!',
        'Todo updated, {honorific}!',
        'Changes applied to the todo, {name}!',
        'Todo modified successfully, {honorific}!',
        'Dobbie has updated the task, {name}!',
        'The todo has been changed, {honorific}!',
        'Dobbie made the adjustments, {name}!',
    ],
    event_clarified: [
        'Dobbie has clarified the event, {honorific}!',
        'The event details are clearer now, {name}!',
        'Dobbie has improved the description, {honorific}!',
        'Event clarified, {name}!',
        'Dobbie enhanced the event details, {honorific}!',
        'Much clearer now, {name}!',
        'Dobbie has sharpened the event info, {honorific}!',
    ],
    event_time_suggest: [
        'Dobbie has some timing suggestions, {name}.',
        'Here are Dobbie\'s thoughts on scheduling, {honorific}.',
        'Dobbie analyzed the timing, {name}.',
        'Some scheduling ideas, {honorific}.',
        'Dobbie has timing recommendations, {name}.',
        'Here\'s what Dobbie suggests for timing, {honorific}.',
        'Dobbie considered the schedule, {name}.',
    ],
    event_modified: [
        'Dobbie has modified the event, {honorific}!',
        'Event updated, {name}!',
        'Changes applied to the event, {honorific}!',
        'Event modified successfully, {name}!',
        'Dobbie has updated the event, {honorific}!',
        'The event has been changed, {name}!',
        'Dobbie made the adjustments, {honorific}!',
    ],
    inbox_empty: [
        'Inbox is empty, {honorific}. Nothing to process.',
        'No items in the inbox, {name}!',
        'The inbox is clear, {honorific}!',
        'Nothing to process, {name}. Inbox is empty.',
        'Dobbie found nothing in the inbox, {honorific}.',
        'All clear, {name}! No inbox items.',
        'The inbox has no items, {honorific}.',
    ],
    inbox_processing: [
        'Dobbie is processing the inbox, {honorific}...',
        'Let Dobbie sort through these, {name}...',
        'Dobbie is organizing the inbox, {honorific}...',
        'Processing inbox items, {name}...',
        'Dobbie is categorizing everything, {honorific}...',
        'Sorting through the inbox, {name}...',
        'Dobbie is handling each item, {honorific}...',
    ],
    inbox_complete: [
        'Dobbie has processed all inbox items, {name}!',
        'Inbox cleared, {honorific}!',
        'All items sorted, {name}!',
        'Inbox processing complete, {honorific}!',
        'Dobbie has organized everything, {name}!',
        'All items categorized, {honorific}!',
        'Inbox is now empty, {name}!',
    ],
    remember_saved: [
        'Dobbie will remember that, {name}!',
        'Stored in memory, {honorific}!',
        'Dobbie has noted it down, {name}!',
        'Dobbie won\'t forget, {honorific}!',
        'Committed to memory, {name}!',
        'Dobbie has saved it, {honorific}!',
        'Remembered, {name}!',
    ],
    today_summary: [
        'Here\'s what Dobbie found for today, {name}.',
        'Your daily summary, {honorific}.',
        'Dobbie has gathered everything for today, {name}.',
        'Today\'s overview, {honorific}.',
        'Here is your day, {name}.',
        'Dobbie prepared today\'s summary, {honorific}.',
        'What\'s ahead today, {name}:',
    ],
    config_show: [
        'Here is your configuration, {honorific}.',
        'Dobbie\'s settings, {name}:',
        'Current configuration, {honorific}:',
        'Your settings, {name}.',
        'Here are the configurations, {honorific}.',
        'Dobbie\'s current setup, {name}:',
        'Configuration details, {honorific}:',
    ],
    provider_added: [
        'Dobbie has added the provider, {name}!',
        'Provider configured successfully, {honorific}!',
        'The API key is saved, {name}!',
        'Provider added, {honorific}!',
        'Dobbie has set up the provider, {name}!',
        'Connection configured, {honorific}!',
        'Provider is ready to use, {name}!',
    ],
    capability_set: [
        'Dobbie has set the capability, {honorific}!',
        'Capability configured, {name}!',
        'The model is now assigned, {honorific}!',
        'Capability updated, {name}!',
        'Dobbie has configured it, {honorific}!',
        'Model assigned successfully, {name}!',
        'Capability is now active, {honorific}!',
    ],
    diagram_generating: [
        'Dobbie is generating a diagram, {honorific}...',
        'Creating the diagram now, {name}...',
        'Dobbie is drawing this out, {honorific}...',
        'Generating visualization, {name}...',
        'Dobbie is sketching the diagram, {honorific}...',
        'Building the diagram, {name}...',
        'Dobbie is crafting a visual, {honorific}...',
    ],
    help_offer: [
        'Is there anything else Dobbie can help with, {name}?',
        'Dobbie hopes this was helpful, {honorific}!',
        'Let Dobbie know if you need anything else, {name}!',
        'Dobbie is always happy to help, {honorific}!',
        'What else can Dobbie do for you, {name}?',
        'Dobbie remains at your service, {honorific}!',
        'Dobbie is here if you need more help, {name}!',
    ],
    startup_greeting: [
        '🧝 *yawns* Dobbie is awake and ready to serve, {name}!',
        '🧝 Dobbie has polished his socks and is reporting for duty, {honorific}!',
        '🧝 Systems online, {name}! Dobbie ran all the diagnostics twice... just to be safe.',
        '🧝 Dobbie is here, {name}! The socks are sorted and the quills are sharp!',
        '🧝 *cracks knuckles* Dobbie is warmed up and eager, {honorific}!',
        '🧝 Good day, {name}! Dobbie has been counting the seconds until your return.',
        '🧝 Dobbie\'s ears perked up the moment you arrived, {name}!',
        '🧝 All candles lit, all scrolls ready — Dobbie awaits your command, {honorific}!',
        '🧝 Dobbie checked the vault, polished the projects, and is standing by, {name}!',
        '🧝 *bounces excitedly* Dobbie is fully operational and at your service, {honorific}!',
    ],
    unknown_command: [
        'Dobbie does not know that spell, {honorific}. Perhaps try one of these?',
        'Dobbie tilts his head... that is not a command Dobbie recognizes, {name}.',
        'Dobbie checked all his scrolls — "{command}" is not among them, {honorific}.',
        '*scratches ear* Dobbie is confused, {name}. Did you mean one of these?',
        'Dobbie has never heard of "{command}," {honorific}. Was it a sneeze?',
        'That word is not in Dobbie\'s vocabulary, {name}. Try one of these!',
        'Dobbie squints at "{command}"... no, {honorific}, Dobbie cannot make sense of it.',
    ],
};

import os from 'os';
import { getUserName, getUserGender } from './state/manager.js';

// ── Honorific pools by gender ──────────────────────────────────────────────
const HONORIFIC_POOLS: Record<string, string[]> = {
    male: ['sir', 'boss', 'master', 'chief', 'captain', 'guv', 'my lord', 'good sir'],
    female: ['ma\'am', 'miss', 'madam', 'my lady', 'boss', 'chief', 'mistress'],
    other: ['boss', 'chief', 'captain', 'friend', 'guv', 'my liege', 'comrade'],
};

// ── Cached values for sync substitution ────────────────────────────────────
let cachedName: string = os.userInfo().username || 'friend';
let cachedHonorificPool: string[] = HONORIFIC_POOLS.other;
let cacheLoaded = false;

/** Pick a random honorific from the cached pool. */
function randomHonorific(): string {
    return cachedHonorificPool[Math.floor(Math.random() * cachedHonorificPool.length)];
}

/**
 * Pre-load the user's name and gender from state. Call once at startup.
 * Safe to skip — falls back to OS username and neutral honorifics.
 */
export async function initResponseName(): Promise<void> {
    if (cacheLoaded) return;
    try {
        cachedName = await getUserName();
    } catch {
        // keep OS fallback
    }
    try {
        const gender = await getUserGender() || 'other';
        cachedHonorificPool = HONORIFIC_POOLS[gender] || HONORIFIC_POOLS.other;
    } catch {
        // keep neutral pool
    }
    cacheLoaded = true;
}

/**
 * Force refresh the cache (e.g. after saving new user settings).
 */
export async function refreshResponseCache(): Promise<void> {
    cacheLoaded = false;
    await initResponseName();
}

// Fire-and-forget on import — will resolve before most responses are needed
initResponseName();

/**
 * Apply {name} and {honorific} substitution to a raw response string.
 * {honorific} randomly picks from the gender pool each time.
 */
function substitute(raw: string): string {
    return raw
        .replace(/{name}/g, cachedName)
        .replace(/{honorific}/g, randomHonorific());
}

/**
 * Get a random response for the given key, with {name} and {honorific} auto-substituted.
 */
export function getResponse(key: ResponseKey): string {
    const options = responses[key];
    if (!options || options.length === 0) {
        return '';
    }
    const index = Math.floor(Math.random() * options.length);
    return substitute(options[index]);
}

/**
 * Get a random response with custom placeholders replaced.
 * {name} and {honorific} are auto-substituted as well.
 * @param key Response key
 * @param replacements Object mapping placeholder names to values
 */
export function getResponseWith(key: ResponseKey, replacements: Record<string, string>): string {
    const options = responses[key];
    if (!options || options.length === 0) {
        return '';
    }
    const index = Math.floor(Math.random() * options.length);
    let response = options[index];
    for (const [placeholder, value] of Object.entries(replacements)) {
        response = response.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    }
    return substitute(response);
}

export default responses;
