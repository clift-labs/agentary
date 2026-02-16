/**
 * Dobbie's personality response catalog.
 * Each key maps to an array of possible responses.
 * Use getResponse(key) to get a random response.
 *
 * Placeholders:
 *   {name}      — user's name (auto-substituted by getPersonalizedResponse)
 *   {honorific} — user's chosen honorific (auto-substituted by getPersonalizedResponse)
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
        'Dobbie is grateful to have helped, {honorific}!',
    ],
    task_complete: [
        'Dobbie has completed the task, {name}!',
        'Done, {honorific}! Dobbie hopes this pleases you.',
        'Dobbie has finished, {name}!',
        'All done, {honorific}! Dobbie worked very hard on this.',
        'Task complete, {honorific}! Dobbie is proud.',
        'Finished, {name}! Dobbie did it!',
        'Dobbie has accomplished the task, {honorific}!',
    ],
    task_saved: [
        'Dobbie has saved everything, {name}!',
        'Saved successfully, {honorific}!',
        'Dobbie has stored this safely, {name}!',
        'It is saved, {honorific}! Dobbie made sure of it.',
        'Safely stored, {honorific}!',
        'Dobbie has preserved it, {honorific}!',
        'Everything is saved, {name}! Dobbie double-checked.',
    ],
    task_discarded: [
        'Dobbie has discarded it, {honorific}.',
        'Discarded as requested, {honorific}.',
        'Dobbie has thrown it away, {honorific}.',
        'Gone, {honorific}. Dobbie has removed it.',
        'Dobbie has deleted it, {honorific}.',
        'It is no more, {honorific}.',
        'Dobbie has disposed of it, {honorific}.',
    ],
    thinking: [
        'Dobbie is thinking, {honorific}...',
        'One moment, {honorific}... Dobbie is pondering...',
        'Dobbie is considering this carefully, {honorific}...',
        'Let Dobbie think about this, {honorific}...',
        'Dobbie is contemplating, {honorific}...',
        'Hmm, Dobbie is working this out, {honorific}...',
        'Dobbie needs a moment to think, {honorific}...',
    ],
    processing: [
        'Dobbie is working on it, {honorific}...',
        'Dobbie is processing, {honorific}...',
        'One moment, {honorific}...',
        'Dobbie is on it, {honorific}...',
        'Working, {honorific}...',
        'Dobbie is handling this, {honorific}...',
        'Please wait, {honorific}... Dobbie is busy...',
    ],
    error: [
        'Dobbie encountered a problem, {honorific}.',
        'Oh no, {honorific}! Dobbie ran into an error.',
        'Dobbie is sorry, {honorific}. Something went wrong.',
        'Dobbie must report an error, {honorific}.',
        'Dobbie has bad news, {honorific}. There was an error.',
        'Something failed, {honorific}. Dobbie apologizes.',
        'Dobbie tried, {honorific}, but there was a problem.',
    ],
    no_vault: [
        'Dobbie cannot find a vault here, {honorific}.',
        'This directory has no vault, {honorific}. Dobbie cannot proceed.',
        '{honorific}, Dobbie needs a vault to work. Please run dobbie init.',
        'No vault found, {honorific}. Dobbie is lost without one.',
        'Dobbie requires a vault, {honorific}. This directory has none.',
        '{honorific}, please create a vault first with dobbie init.',
        'Dobbie looked everywhere, {honorific}, but found no vault.',
    ],
    need_project: [
        'Dobbie needs to know which project, {honorific}.',
        'Which project shall Dobbie work on, {honorific}?',
        'Please tell Dobbie which project, {honorific}.',
        'Dobbie requires a project to be selected, {honorific}.',
        '{honorific}, Dobbie needs a project to proceed.',
        'Which project, {honorific}? Dobbie awaits your choice.',
        'Dobbie cannot continue without knowing the project, {honorific}.',
    ],
    project_created: [
        'Dobbie has created the project, {honorific}!',
        'Project created successfully, {honorific}!',
        'Your new project is ready, {honorific}!',
        'Dobbie set up the project for you, {honorific}!',
        'The project is now ready, {honorific}!',
        'Dobbie has prepared everything, {honorific}!',
        'Project initialized, {honorific}! Ready to go!',
    ],
    project_switched: [
        'Dobbie has switched to the project, {honorific}!',
        'Now working on the project, {honorific}!',
        'Dobbie is ready to work on this project, {honorific}!',
        'Switched successfully, {honorific}!',
        'Dobbie is now focused on this project, {honorific}!',
        'Project changed, {honorific}! Dobbie is ready.',
        'Dobbie has moved to the new project, {honorific}!',
    ],
    sync_start: [
        'Dobbie is syncing with GitHub, {honorific}...',
        'Syncing everything now, {honorific}...',
        'Dobbie is pushing to GitHub, {honorific}...',
        'Starting sync, {honorific}...',
        'Dobbie is connecting to GitHub, {honorific}...',
        'Uploading changes, {honorific}...',
        'Dobbie is synchronizing, {honorific}...',
    ],
    sync_complete: [
        'Dobbie has synced everything, {name}!',
        'All synced up, {honorific}!',
        'GitHub sync complete, {name}!',
        'Everything is safely synced, {honorific}!',
        'Sync successful, {honorific}!',
        'Dobbie has pushed all changes, {name}!',
        'Your work is backed up, {honorific}!',
    ],
    sync_error: [
        'Dobbie had trouble syncing, {honorific}.',
        'The sync failed, {honorific}. Dobbie is sorry.',
        'Dobbie could not complete the sync, {honorific}.',
        'Sync encountered an error, {honorific}.',
        'GitHub rejected Dobbie, {honorific}. Something went wrong.',
        'Dobbie failed to push, {honorific}.',
        'There was a problem with the sync, {honorific}.',
    ],
    note_reviewing: [
        'Dobbie is reviewing your note, {honorific}...',
        'Let Dobbie take a look at this, {honorific}...',
        'Dobbie is carefully reading this, {honorific}...',
        'Reviewing now, {honorific}...',
        'Dobbie is examining your note, {honorific}...',
        'Dobbie is studying this carefully, {honorific}...',
        'Reading through it now, {honorific}...',
    ],
    note_improved: [
        'Dobbie has improved the note, {honorific}!',
        'The note is better now, {honorific}!',
        'Dobbie has polished it up, {honorific}!',
        'Note enhanced, {honorific}!',
        'Dobbie made it shine, {honorific}!',
        'Improvements applied, {honorific}!',
        'Dobbie has refined the note, {honorific}!',
    ],
    note_questions: [
        'Dobbie has some questions about this, {honorific}:',
        'Here are some things to consider, {honorific}:',
        'Dobbie wonders about these points, {honorific}:',
        'Some questions for you, {honorific}:',
        'Dobbie is curious about these things, {honorific}:',
        'These points need clarification, {honorific}:',
        'Dobbie would like to ask, {honorific}:',
    ],
    note_modified: [
        'Dobbie has modified the note, {honorific}!',
        'Changes applied, {honorific}!',
        'The note has been updated, {honorific}!',
        'Note modified successfully, {honorific}!',
        'Dobbie has made the changes, {honorific}!',
        'Updates complete, {honorific}!',
        'Dobbie altered the note as requested, {honorific}!',
    ],
    note_formatted: [
        'Dobbie is formatting your note as markdown, {honorific}...',
        'Making it look nice, {honorific}...',
        'Dobbie is tidying up the formatting, {honorific}...',
        'Formatting now, {honorific}...',
        'Dobbie is making it pretty, {honorific}...',
        'Applying markdown formatting, {honorific}...',
        'Dobbie is beautifying your note, {honorific}...',
    ],
    todo_breakdown: [
        'Dobbie is breaking down the task, {honorific}...',
        'Let Dobbie split this into smaller pieces, {honorific}...',
        'Dobbie is creating subtasks, {honorific}...',
        'Breaking it down now, {honorific}...',
        'Dobbie is dividing the work, {honorific}...',
        'Splitting into manageable parts, {honorific}...',
        'Dobbie is decomposing the task, {honorific}...',
    ],
    todo_clarified: [
        'Dobbie has clarified the task, {honorific}!',
        'The todo is clearer now, {honorific}!',
        'Dobbie has made it more specific, {honorific}!',
        'Task clarified, {honorific}!',
        'Dobbie improved the description, {honorific}!',
        'Much clearer now, {honorific}!',
        'Dobbie has sharpened the details, {honorific}!',
    ],
    todo_estimated: [
        'Dobbie has analyzed the effort, {honorific}.',
        'Here is Dobbie\'s estimate, {honorific}.',
        'Dobbie has assessed this task, {honorific}.',
        'Estimation complete, {honorific}.',
        'Dobbie calculated the effort, {honorific}.',
        'Here\'s what Dobbie thinks it will take, {honorific}.',
        'Dobbie has evaluated the complexity, {honorific}.',
    ],
    todo_modified: [
        'Dobbie has modified the todo, {honorific}!',
        'Todo updated, {honorific}!',
        'Changes applied to the todo, {honorific}!',
        'Todo modified successfully, {honorific}!',
        'Dobbie has updated the task, {honorific}!',
        'The todo has been changed, {honorific}!',
        'Dobbie made the adjustments, {honorific}!',
    ],
    event_clarified: [
        'Dobbie has clarified the event, {honorific}!',
        'The event details are clearer now, {honorific}!',
        'Dobbie has improved the description, {honorific}!',
        'Event clarified, {honorific}!',
        'Dobbie enhanced the event details, {honorific}!',
        'Much clearer now, {honorific}!',
        'Dobbie has sharpened the event info, {honorific}!',
    ],
    event_time_suggest: [
        'Dobbie has some timing suggestions, {honorific}.',
        'Here are Dobbie\'s thoughts on scheduling, {honorific}.',
        'Dobbie analyzed the timing, {honorific}.',
        'Some scheduling ideas, {honorific}.',
        'Dobbie has timing recommendations, {honorific}.',
        'Here\'s what Dobbie suggests for timing, {honorific}.',
        'Dobbie considered the schedule, {honorific}.',
    ],
    event_modified: [
        'Dobbie has modified the event, {honorific}!',
        'Event updated, {honorific}!',
        'Changes applied to the event, {honorific}!',
        'Event modified successfully, {honorific}!',
        'Dobbie has updated the event, {honorific}!',
        'The event has been changed, {honorific}!',
        'Dobbie made the adjustments, {honorific}!',
    ],
    inbox_empty: [
        'Inbox is empty, {honorific}. Nothing to process.',
        'No items in the inbox, {honorific}!',
        'The inbox is clear, {honorific}!',
        'Nothing to process, {honorific}. Inbox is empty.',
        'Dobbie found nothing in the inbox, {honorific}.',
        'All clear, {honorific}! No inbox items.',
        'The inbox has no items, {honorific}.',
    ],
    inbox_processing: [
        'Dobbie is processing the inbox, {honorific}...',
        'Let Dobbie sort through these, {honorific}...',
        'Dobbie is organizing the inbox, {honorific}...',
        'Processing inbox items, {honorific}...',
        'Dobbie is categorizing everything, {honorific}...',
        'Sorting through the inbox, {honorific}...',
        'Dobbie is handling each item, {honorific}...',
    ],
    inbox_complete: [
        'Dobbie has processed all inbox items, {honorific}!',
        'Inbox cleared, {honorific}!',
        'All items sorted, {honorific}!',
        'Inbox processing complete, {honorific}!',
        'Dobbie has organized everything, {honorific}!',
        'All items categorized, {honorific}!',
        'Inbox is now empty, {honorific}!',
    ],
    remember_saved: [
        'Dobbie will remember that, {name}!',
        'Stored in memory, {honorific}!',
        'Dobbie has noted it down, {name}!',
        'Dobbie won\'t forget, {honorific}!',
        'Committed to memory, {honorific}!',
        'Dobbie has saved it, {name}!',
        'Remembered, {honorific}!',
    ],
    today_summary: [
        'Here\'s what Dobbie found for today, {name}.',
        'Your daily summary, {honorific}.',
        'Dobbie has gathered everything for today, {name}.',
        'Today\'s overview, {honorific}.',
        'Here is your day, {name}.',
        'Dobbie prepared today\'s summary, {honorific}.',
        'What\'s ahead today, {honorific}:',
    ],
    config_show: [
        'Here is your configuration, {honorific}.',
        'Dobbie\'s settings, {honorific}:',
        'Current configuration, {honorific}:',
        'Your settings, {honorific}.',
        'Here are the configurations, {honorific}.',
        'Dobbie\'s current setup, {honorific}:',
        'Configuration details, {honorific}:',
    ],
    provider_added: [
        'Dobbie has added the provider, {honorific}!',
        'Provider configured successfully, {honorific}!',
        'The API key is saved, {honorific}!',
        'Provider added, {honorific}!',
        'Dobbie has set up the provider, {honorific}!',
        'Connection configured, {honorific}!',
        'Provider is ready to use, {honorific}!',
    ],
    capability_set: [
        'Dobbie has set the capability, {honorific}!',
        'Capability configured, {honorific}!',
        'The model is now assigned, {honorific}!',
        'Capability updated, {honorific}!',
        'Dobbie has configured it, {honorific}!',
        'Model assigned successfully, {honorific}!',
        'Capability is now active, {honorific}!',
    ],
    diagram_generating: [
        'Dobbie is generating a diagram, {honorific}...',
        'Creating the diagram now, {honorific}...',
        'Dobbie is drawing this out, {honorific}...',
        'Generating visualization, {honorific}...',
        'Dobbie is sketching the diagram, {honorific}...',
        'Building the diagram, {honorific}...',
        'Dobbie is crafting a visual, {honorific}...',
    ],
    help_offer: [
        'Is there anything else Dobbie can help with, {name}?',
        'Dobbie hopes this was helpful, {name}!',
        'Let Dobbie know if you need anything else, {honorific}!',
        'Dobbie is always happy to help, {honorific}!',
        'What else can Dobbie do for you, {name}?',
        'Dobbie remains at your service, {honorific}!',
        'Dobbie is here if you need more help, {name}!',
    ],
    startup_greeting: [
        '🧝 *yawns* Dobbie is awake and ready to serve, {name}!',
        '🧝 Dobbie has polished his socks and is reporting for duty, {name}!',
        '🧝 Systems online, {honorific}! Dobbie ran all the diagnostics twice... just to be safe.',
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
        'Dobbie tilts his head... that is not a command Dobbie recognizes, {honorific}.',
        'Dobbie checked all his scrolls — "{command}" is not among them, {honorific}.',
        '*scratches ear* Dobbie is confused, {honorific}. Did you mean one of these?',
        'Dobbie has never heard of "{command}," {honorific}. Was it a sneeze?',
        'That word is not in Dobbie\'s vocabulary, {honorific}. Try one of these!',
        'Dobbie squints at "{command}"... no, {honorific}, Dobbie cannot make sense of it.',
    ],
};

import { getUserName, getUserHonorific } from './state/manager.js';

/**
 * Get a random response for the given key (sync version, no substitutions).
 */
export function getResponse(key: ResponseKey): string {
    const options = responses[key];
    if (!options || options.length === 0) {
        return '';
    }
    const index = Math.floor(Math.random() * options.length);
    return options[index];
}

/**
 * Get a random response with {name} and {honorific} automatically substituted.
 * Use this for user-facing messages.
 */
export async function getPersonalizedResponse(key: ResponseKey): Promise<string> {
    let response = getResponse(key);
    if (response.includes('{name}')) {
        const name = await getUserName();
        response = response.replace(/{name}/g, name);
    }
    if (response.includes('{honorific}')) {
        const honorific = await getUserHonorific();
        response = response.replace(/{honorific}/g, honorific);
    }
    return response;
}

/**
 * Get a random response with custom placeholders replaced.
 * {honorific} is auto-injected if not explicitly provided.
 * @param key Response key
 * @param replacements Object mapping placeholder names to values
 */
export function getResponseWith(key: ResponseKey, replacements: Record<string, string>): string {
    let response = getResponse(key);
    for (const [placeholder, value] of Object.entries(replacements)) {
        response = response.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    }
    return response;
}

/**
 * Like getResponseWith but also auto-injects {name} and {honorific}.
 */
export async function getPersonalizedResponseWith(key: ResponseKey, replacements: Record<string, string>): Promise<string> {
    let response = getResponse(key);

    // Apply explicit replacements first
    for (const [placeholder, value] of Object.entries(replacements)) {
        response = response.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    }

    // Auto-inject name and honorific if still present
    if (response.includes('{name}')) {
        const name = await getUserName();
        response = response.replace(/{name}/g, name);
    }
    if (response.includes('{honorific}')) {
        const honorific = await getUserHonorific();
        response = response.replace(/{honorific}/g, honorific);
    }

    return response;
}

export default responses;
