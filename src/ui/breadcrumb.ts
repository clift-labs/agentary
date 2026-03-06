/**
 * Breadcrumb navigation for the Dobbi TUI.
 *
 * Maintains a dot-separated path (e.g. `dobbi.note`) so the user always
 * knows where they are in the interface hierarchy.
 *
 *   🤖 dobbi>              ← shell root
 *   🤖 dobbi.note>         ← inside the note editor
 *   🤖 dobbi.todo>         ← inside the todo editor
 */
import chalk from 'chalk';

let segments: string[] = ['dobbi'];

/** Push a new segment onto the breadcrumb path. */
export function pushCrumb(segment: string): void {
    segments.push(segment);
}

/** Pop the last segment from the breadcrumb path. */
export function popCrumb(): void {
    if (segments.length > 1) segments.pop();
}

/** Reset the breadcrumb path back to root. */
export function resetCrumbs(): void {
    segments = ['dobbi'];
}

/** Get the current breadcrumb segments (for display in headers, etc.). */
export function getCrumbs(): string[] {
    return [...segments];
}

/** Build the styled prompt string from the current breadcrumb path. */
export function breadcrumbPrompt(): string {
    const path = segments.join('.');
    return chalk.cyan(path) + chalk.gray('> ');
}
