#!/usr/bin/env node

/**
 * Dobbie Service - Background daemon for task processing.
 * 
 * This is the main entry point for the service when run as a daemon.
 * It starts the Unix socket server and queue processor.
 */

import { ServiceServer } from './server.js';
import { getQueueManager } from './queue/manager.js';
import { getQueueProcessor } from './queue/processor.js';
import { SOCKET_PATH } from './daemon.js';
import type { ServiceRequest, ServiceResponse, Task } from './protocol.js';

// Only run if this is the service process
const isService = process.env.DOBBIE_SERVICE === '1';

async function handleRequest(request: ServiceRequest): Promise<ServiceResponse> {
    const queueManager = await getQueueManager();
    const queueProcessor = getQueueProcessor();

    try {
        switch (request.type) {
            case 'task': {
                const task = request.payload as Task;
                const taskId = queueManager.enqueue(task);
                return {
                    requestId: request.id,
                    status: 'queued',
                    result: { taskId },
                };
            }

            case 'query': {
                const payload = request.payload as { query: string; taskId?: string };

                switch (payload.query) {
                    case 'queue.size':
                        return {
                            requestId: request.id,
                            status: 'completed',
                            result: { size: queueManager.size() },
                        };

                    case 'queue.status':
                        return {
                            requestId: request.id,
                            status: 'completed',
                            result: queueManager.getFullStatus(),
                        };

                    case 'task.status':
                        const task = queueManager.getTask(payload.taskId!);
                        return {
                            requestId: request.id,
                            status: 'completed',
                            result: task,
                        };

                    default:
                        return {
                            requestId: request.id,
                            status: 'error',
                            error: `Unknown query: ${payload.query}`,
                        };
                }
            }

            case 'control': {
                const payload = request.payload as { control: string; confirm?: boolean };

                switch (payload.control) {
                    case 'queue.clear':
                        if (!payload.confirm) {
                            return {
                                requestId: request.id,
                                status: 'error',
                                error: 'Confirmation required to clear queue',
                            };
                        }
                        const cleared = queueManager.clear();
                        return {
                            requestId: request.id,
                            status: 'completed',
                            result: { cleared },
                        };

                    case 'queue.pause':
                        queueProcessor.pause();
                        return {
                            requestId: request.id,
                            status: 'completed',
                            result: { paused: true },
                        };

                    case 'queue.resume':
                        queueProcessor.resume();
                        return {
                            requestId: request.id,
                            status: 'completed',
                            result: { paused: false },
                        };

                    default:
                        return {
                            requestId: request.id,
                            status: 'error',
                            error: `Unknown control: ${payload.control}`,
                        };
                }
            }

            default:
                return {
                    requestId: request.id,
                    status: 'error',
                    error: `Unknown request type: ${request.type}`,
                };
        }
    } catch (error) {
        return {
            requestId: request.id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function main(): Promise<void> {
    console.log('Dobbie service starting...');

    const server = new ServiceServer();
    const processor = getQueueProcessor();

    // Set up request handler
    server.onRequest(handleRequest);

    // Handle shutdown signals
    const shutdown = async () => {
        console.log('Shutting down...');
        processor.stop();
        await server.stop();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Start server and processor
    await server.start(SOCKET_PATH);
    await processor.start();

    console.log(`Dobbie service running on ${SOCKET_PATH}`);
}

if (isService) {
    main().catch((error) => {
        console.error('Failed to start service:', error);
        process.exit(1);
    });
}

export { handleRequest };
