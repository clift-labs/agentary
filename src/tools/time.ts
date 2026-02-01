import { exec } from 'child_process';
import { promisify } from 'util';
import type { Tool } from './types.js';
import { registerTool } from './types.js';

const execAsync = promisify(exec);

export const timeTool: Tool = {
    name: 'time',
    description: 'Shows the current local time',
    type: 'deterministic',

    async execute(): Promise<string> {
        const { stdout } = await execAsync('date');
        return `The current time is: ${stdout.trim()}`;
    },
};

// Register the tool
registerTool(timeTool);

export default timeTool;
