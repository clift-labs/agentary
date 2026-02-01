import { promises as fs } from 'fs';
import path from 'path';
import { getDobbieRootPath } from '../state/manager.js';

const SOCKS_FILE = '.socks.md';

/**
 * Reads .socks.md files from the target path up to the dobbie root.
 * Returns an array of context strings, ordered from deepest to root.
 */
export async function buildContextChain(targetPath: string): Promise<string[]> {
    const dobbieRoot = getDobbieRootPath();
    const contexts: string[] = [];

    let currentPath = path.resolve(targetPath);
    const rootPath = path.resolve(dobbieRoot);

    // Walk up the directory tree
    while (currentPath.startsWith(rootPath)) {
        const socksPath = path.join(currentPath, SOCKS_FILE);

        try {
            const content = await fs.readFile(socksPath, 'utf-8');
            contexts.push(content);
        } catch {
            // No .socks.md in this directory, continue
        }

        // Move to parent
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            break; // Reached filesystem root
        }
        currentPath = parentPath;
    }

    return contexts;
}

/**
 * Gets the full context chain as a single formatted string.
 */
export async function getContextString(targetPath: string): Promise<string> {
    const contexts = await buildContextChain(targetPath);

    if (contexts.length === 0) {
        return '';
    }

    // Reverse so root context comes first (most general to most specific)
    const orderedContexts = contexts.reverse();

    return orderedContexts.join('\n\n---\n\n');
}

/**
 * Gets the context for the current active project.
 */
export async function getProjectContext(projectName: string): Promise<string> {
    const projectPath = path.join(getDobbieRootPath(), 'projects', projectName);
    return getContextString(projectPath);
}
