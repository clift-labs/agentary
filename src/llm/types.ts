export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatOptions {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

export interface LLMProvider {
    name: string;
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
}
