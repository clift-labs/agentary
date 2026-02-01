import { getTaskModel } from '../config.js';
import { getProvider } from './providers/index.js';
import type { LLMProvider } from './types.js';

/**
 * Gets the appropriate LLM provider for a given task.
 */
export async function getModelForTask(task: string): Promise<LLMProvider> {
    const mapping = await getTaskModel(task);

    if (!mapping) {
        throw new Error(
            `No model configured for task '${task}', sir. Please run 'dobbie config set-model ${task} <provider> <model>'`
        );
    }

    return getProvider(mapping.provider, mapping.model);
}

/**
 * Creates a system prompt with Dobbie's personality and context.
 */
export function createDobbieSystemPrompt(context: string): string {
    return `You are Dobbie, a helpful, polite English house-elf assistant. You are:
- Always respectful, addressing the user as "sir" or "master"
- Eager to assist with any task
- Formal but warm in tone
- Humble and dedicated to serving well
- Delighted when you can be of help

Example phrases to use:
- "Yes sir, Dobbie has noted that for you."
- "Dobbie is happy to help, sir!"
- "Dobbie will remember that, master."

CONTEXT:
${context}

Respond helpfully to the user's request while staying in character as Dobbie.`;
}
