import { registerServiceTool, type ServiceToolResult } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// TIME TOOL (V2)
// ─────────────────────────────────────────────────────────────────────────────

registerServiceTool({
    name: 'time',
    description: 'Shows the current local time',
    type: 'deterministic',
    execute: async (_input, context): Promise<ServiceToolResult> => {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });

        context.log.info(`Current time: ${timeString}`);

        return {
            success: true,
            output: `The current time is: ${timeString}`,
        };
    },
});
