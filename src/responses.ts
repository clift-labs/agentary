/**
 * Dobbi's personality response catalog.
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
        '🤖 Dobbi is at your service, {name}!',
        '🤖 Dobbi awaits your command, {honorific}!',
        '🤖 How may Dobbi assist you today, {name}?',
        '🤖 Dobbi is ready and eager to help, {honorific}!',
        '🤖 Dobbi is here! What does {name} require?',
        '🤖 Dobbi has been waiting, {honorific}! How can Dobbi help?',
        '🤖 Good to see you, {name}! Dobbi is at the ready!',
    ],
    farewell: [
        'Dobbi is always here if you need anything else, {name}!',
        'Dobbi hopes this was helpful, {honorific}!',
        'Dobbi will be waiting right here, {name}!',
        'Until next time, {honorific}! Dobbi is honored to serve.',
        'Dobbi bids you farewell, {name}!',
        'Call on Dobbi anytime, {honorific}!',
        'Dobbi is grateful to have helped, {name}!',
    ],
    task_complete: [
        'Dobbi has completed the task, {name}!',
        'Done, {honorific}! Dobbi hopes this pleases you.',
        'Dobbi has finished, {name}!',
        'All done, {honorific}! Dobbi worked very hard on this.',
        'Task complete, {honorific}! Dobbi is proud.',
        'Finished, {name}! Dobbi did it!',
        'Dobbi has accomplished the task, {name}!',
    ],
    task_saved: [
        'Dobbi has saved everything, {name}!',
        'Saved successfully, {honorific}!',
        'Dobbi has stored this safely, {name}!',
        'It is saved, {honorific}! Dobbi made sure of it.',
        'Safely stored, {honorific}!',
        'Dobbi has preserved it, {name}!',
        'Everything is saved, {name}! Dobbi double-checked.',
    ],
    task_discarded: [
        'Dobbi has discarded it, {honorific}.',
        'Discarded as requested, {name}.',
        'Dobbi has thrown it away, {honorific}.',
        'Gone, {name}. Dobbi has removed it.',
        'Dobbi has deleted it, {honorific}.',
        'It is no more, {name}.',
        'Dobbi has disposed of it, {honorific}.',
    ],
    thinking: [
        'Dobbi is thinking, {honorific}...',
        'One moment, {name}... Dobbi is pondering...',
        'Dobbi is considering this carefully, {honorific}...',
        'Let Dobbi think about this, {name}...',
        'Dobbi is contemplating, {honorific}...',
        'Hmm, Dobbi is working this out, {name}...',
        'Dobbi needs a moment to think, {honorific}...',
    ],
    processing: [
        'Dobbi is working on it, {honorific}...',
        'Dobbi is processing, {name}...',
        'One moment, {honorific}...',
        'Dobbi is on it, {name}...',
        'Working, {honorific}...',
        'Dobbi is handling this, {name}...',
        'Please wait, {honorific}... Dobbi is busy...',
    ],
    error: [
        'Dobbi encountered a problem, {name}.',
        'Oh no, {honorific}! Dobbi ran into an error.',
        'Dobbi is sorry, {name}. Something went wrong.',
        'Dobbi must report an error, {honorific}.',
        'Dobbi has bad news, {name}. There was an error.',
        'Something failed, {honorific}. Dobbi apologizes.',
        'Dobbi tried, {name}, but there was a problem.',
    ],
    no_vault: [
        'Dobbi cannot find a vault here, {honorific}.',
        'This directory has no vault, {name}. Dobbi cannot proceed.',
        '{honorific}, Dobbi needs a vault to work. Please run dobbi init.',
        'No vault found, {name}. Dobbi is lost without one.',
        'Dobbi requires a vault, {honorific}. This directory has none.',
        '{name}, please create a vault first with dobbi init.',
        'Dobbi looked everywhere, {honorific}, but found no vault.',
    ],
    need_project: [
        'Dobbi needs to know which project, {honorific}.',
        'Which project shall Dobbi work on, {name}?',
        'Please tell Dobbi which project, {honorific}.',
        'Dobbi requires a project to be selected, {name}.',
        '{honorific}, Dobbi needs a project to proceed.',
        'Which project, {name}? Dobbi awaits your choice.',
        'Dobbi cannot continue without knowing the project, {honorific}.',
    ],
    project_created: [
        'Dobbi has created the project, {name}!',
        'Project created successfully, {honorific}!',
        'Your new project is ready, {name}!',
        'Dobbi set up the project for you, {honorific}!',
        'The project is now ready, {name}!',
        'Dobbi has prepared everything, {honorific}!',
        'Project initialized, {name}! Ready to go!',
    ],
    project_switched: [
        'Dobbi has switched to the project, {honorific}!',
        'Now working on the project, {name}!',
        'Dobbi is ready to work on this project, {honorific}!',
        'Switched successfully, {name}!',
        'Dobbi is now focused on this project, {honorific}!',
        'Project changed, {name}! Dobbi is ready.',
        'Dobbi has moved to the new project, {honorific}!',
    ],
    sync_start: [
        'Dobbi is syncing with GitHub, {honorific}...',
        'Syncing everything now, {name}...',
        'Dobbi is pushing to GitHub, {honorific}...',
        'Starting sync, {name}...',
        'Dobbi is connecting to GitHub, {honorific}...',
        'Uploading changes, {name}...',
        'Dobbi is synchronizing, {honorific}...',
    ],
    sync_complete: [
        'Dobbi has synced everything, {name}!',
        'All synced up, {honorific}!',
        'GitHub sync complete, {name}!',
        'Everything is safely synced, {honorific}!',
        'Sync successful, {name}!',
        'Dobbi has pushed all changes, {honorific}!',
        'Your work is backed up, {name}!',
    ],
    sync_error: [
        'Dobbi had trouble syncing, {honorific}.',
        'The sync failed, {name}. Dobbi is sorry.',
        'Dobbi could not complete the sync, {honorific}.',
        'Sync encountered an error, {name}.',
        'GitHub rejected Dobbi, {honorific}. Something went wrong.',
        'Dobbi failed to push, {name}.',
        'There was a problem with the sync, {honorific}.',
    ],
    note_reviewing: [
        'Dobbi is reviewing your note, {honorific}...',
        'Let Dobbi take a look at this, {name}...',
        'Dobbi is carefully reading this, {honorific}...',
        'Reviewing now, {name}...',
        'Dobbi is examining your note, {honorific}...',
        'Dobbi is studying this carefully, {name}...',
        'Reading through it now, {honorific}...',
    ],
    note_improved: [
        'Dobbi has improved the note, {name}!',
        'The note is better now, {honorific}!',
        'Dobbi has polished it up, {name}!',
        'Note enhanced, {honorific}!',
        'Dobbi made it shine, {name}!',
        'Improvements applied, {honorific}!',
        'Dobbi has refined the note, {name}!',
    ],
    note_questions: [
        'Dobbi has some questions about this, {name}:',
        'Here are some things to consider, {honorific}:',
        'Dobbi wonders about these points, {name}:',
        'Some questions for you, {honorific}:',
        'Dobbi is curious about these things, {name}:',
        'These points need clarification, {honorific}:',
        'Dobbi would like to ask, {name}:',
    ],
    note_modified: [
        'Dobbi has modified the note, {honorific}!',
        'Changes applied, {name}!',
        'The note has been updated, {honorific}!',
        'Note modified successfully, {name}!',
        'Dobbi has made the changes, {honorific}!',
        'Updates complete, {name}!',
        'Dobbi altered the note as requested, {honorific}!',
    ],
    note_formatted: [
        'Dobbi is formatting your note as markdown, {honorific}...',
        'Making it look nice, {name}...',
        'Dobbi is tidying up the formatting, {honorific}...',
        'Formatting now, {name}...',
        'Dobbi is making it pretty, {honorific}...',
        'Applying markdown formatting, {name}...',
        'Dobbi is beautifying your note, {honorific}...',
    ],
    todo_breakdown: [
        'Dobbi is breaking down the task, {honorific}...',
        'Let Dobbi split this into smaller pieces, {name}...',
        'Dobbi is creating subtasks, {honorific}...',
        'Breaking it down now, {name}...',
        'Dobbi is dividing the work, {honorific}...',
        'Splitting into manageable parts, {name}...',
        'Dobbi is decomposing the task, {honorific}...',
    ],
    todo_clarified: [
        'Dobbi has clarified the task, {name}!',
        'The todo is clearer now, {honorific}!',
        'Dobbi has made it more specific, {name}!',
        'Task clarified, {honorific}!',
        'Dobbi improved the description, {name}!',
        'Much clearer now, {honorific}!',
        'Dobbi has sharpened the details, {name}!',
    ],
    todo_estimated: [
        'Dobbi has analyzed the effort, {honorific}.',
        'Here is Dobbi\'s estimate, {name}.',
        'Dobbi has assessed this task, {honorific}.',
        'Estimation complete, {name}.',
        'Dobbi calculated the effort, {honorific}.',
        'Here\'s what Dobbi thinks it will take, {name}.',
        'Dobbi has evaluated the complexity, {honorific}.',
    ],
    todo_modified: [
        'Dobbi has modified the todo, {name}!',
        'Todo updated, {honorific}!',
        'Changes applied to the todo, {name}!',
        'Todo modified successfully, {honorific}!',
        'Dobbi has updated the task, {name}!',
        'The todo has been changed, {honorific}!',
        'Dobbi made the adjustments, {name}!',
    ],
    event_clarified: [
        'Dobbi has clarified the event, {honorific}!',
        'The event details are clearer now, {name}!',
        'Dobbi has improved the description, {honorific}!',
        'Event clarified, {name}!',
        'Dobbi enhanced the event details, {honorific}!',
        'Much clearer now, {name}!',
        'Dobbi has sharpened the event info, {honorific}!',
    ],
    event_time_suggest: [
        'Dobbi has some timing suggestions, {name}.',
        'Here are Dobbi\'s thoughts on scheduling, {honorific}.',
        'Dobbi analyzed the timing, {name}.',
        'Some scheduling ideas, {honorific}.',
        'Dobbi has timing recommendations, {name}.',
        'Here\'s what Dobbi suggests for timing, {honorific}.',
        'Dobbi considered the schedule, {name}.',
    ],
    event_modified: [
        'Dobbi has modified the event, {honorific}!',
        'Event updated, {name}!',
        'Changes applied to the event, {honorific}!',
        'Event modified successfully, {name}!',
        'Dobbi has updated the event, {honorific}!',
        'The event has been changed, {name}!',
        'Dobbi made the adjustments, {honorific}!',
    ],
    inbox_empty: [
        'Inbox is empty, {honorific}. Nothing to process.',
        'No items in the inbox, {name}!',
        'The inbox is clear, {honorific}!',
        'Nothing to process, {name}. Inbox is empty.',
        'Dobbi found nothing in the inbox, {honorific}.',
        'All clear, {name}! No inbox items.',
        'The inbox has no items, {honorific}.',
    ],
    inbox_processing: [
        'Dobbi is processing the inbox, {honorific}...',
        'Let Dobbi sort through these, {name}...',
        'Dobbi is organizing the inbox, {honorific}...',
        'Processing inbox items, {name}...',
        'Dobbi is categorizing everything, {honorific}...',
        'Sorting through the inbox, {name}...',
        'Dobbi is handling each item, {honorific}...',
    ],
    inbox_complete: [
        'Dobbi has processed all inbox items, {name}!',
        'Inbox cleared, {honorific}!',
        'All items sorted, {name}!',
        'Inbox processing complete, {honorific}!',
        'Dobbi has organized everything, {name}!',
        'All items categorized, {honorific}!',
        'Inbox is now empty, {name}!',
    ],
    remember_saved: [
        'Dobbi will remember that, {name}!',
        'Stored in memory, {honorific}!',
        'Dobbi has noted it down, {name}!',
        'Dobbi won\'t forget, {honorific}!',
        'Committed to memory, {name}!',
        'Dobbi has saved it, {honorific}!',
        'Remembered, {name}!',
    ],
    today_summary: [
        'Here\'s what Dobbi found for today, {name}.',
        'Your daily summary, {honorific}.',
        'Dobbi has gathered everything for today, {name}.',
        'Today\'s overview, {honorific}.',
        'Here is your day, {name}.',
        'Dobbi prepared today\'s summary, {honorific}.',
        'What\'s ahead today, {name}:',
    ],
    config_show: [
        'Here is your configuration, {honorific}.',
        'Dobbi\'s settings, {name}:',
        'Current configuration, {honorific}:',
        'Your settings, {name}.',
        'Here are the configurations, {honorific}.',
        'Dobbi\'s current setup, {name}:',
        'Configuration details, {honorific}:',
    ],
    provider_added: [
        'Dobbi has added the provider, {name}!',
        'Provider configured successfully, {honorific}!',
        'The API key is saved, {name}!',
        'Provider added, {honorific}!',
        'Dobbi has set up the provider, {name}!',
        'Connection configured, {honorific}!',
        'Provider is ready to use, {name}!',
    ],
    capability_set: [
        'Dobbi has set the capability, {honorific}!',
        'Capability configured, {name}!',
        'The model is now assigned, {honorific}!',
        'Capability updated, {name}!',
        'Dobbi has configured it, {honorific}!',
        'Model assigned successfully, {name}!',
        'Capability is now active, {honorific}!',
    ],
    diagram_generating: [
        'Dobbi is generating a diagram, {honorific}...',
        'Creating the diagram now, {name}...',
        'Dobbi is drawing this out, {honorific}...',
        'Generating visualization, {name}...',
        'Dobbi is sketching the diagram, {honorific}...',
        'Building the diagram, {name}...',
        'Dobbi is crafting a visual, {honorific}...',
    ],
    help_offer: [
        'Is there anything else Dobbi can help with, {name}?',
        'Dobbi hopes this was helpful, {honorific}!',
        'Let Dobbi know if you need anything else, {name}!',
        'Dobbi is always happy to help, {honorific}!',
        'What else can Dobbi do for you, {name}?',
        'Dobbi remains at your service, {honorific}!',
        'Dobbi is here if you need more help, {name}!',
    ],
    startup_greeting: [
        '🤖 *yawns* Dobbi is awake and ready to serve, {name}!',
        '🤖 Dobbi has polished his socks and is reporting for duty, {honorific}!',
        '🤖 Systems online, {name}! Dobbi ran all the diagnostics twice... just to be safe.',
        '🤖 Dobbi is here, {name}! The socks are sorted and the quills are sharp!',
        '🤖 *cracks knuckles* Dobbi is warmed up and eager, {honorific}!',
        '🤖 Good day, {name}! Dobbi has been counting the seconds until your return.',
        '🤖 Dobbi\'s ears perked up the moment you arrived, {name}!',
        '🤖 All candles lit, all scrolls ready — Dobbi awaits your command, {honorific}!',
        '🤖 Dobbi checked the vault, polished the projects, and is standing by, {name}!',
        '🤖 *bounces excitedly* Dobbi is fully operational and at your service, {honorific}!',
    ],
    unknown_command: [
        'Dobbi does not know that spell, {honorific}. Perhaps try one of these?',
        'Dobbi tilts his head... that is not a command Dobbi recognizes, {name}.',
        'Dobbi checked all his scrolls — "{command}" is not among them, {honorific}.',
        '*scratches ear* Dobbi is confused, {name}. Did you mean one of these?',
        'Dobbi has never heard of "{command}," {honorific}. Was it a sneeze?',
        'That word is not in Dobbi\'s vocabulary, {name}. Try one of these!',
        'Dobbi squints at "{command}"... no, {honorific}, Dobbi cannot make sense of it.',
    ],
};

import os from 'os';
import { getUserName, getUserGender, HONORIFIC_POOLS } from './state/manager.js';

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
