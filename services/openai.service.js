// src/services/openai.service.js
const { openai, tools } = require('../config/openai.config');

class OpenAIService {
    async createMessage(threadId, content) {
        return await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: content
        });
    }

    async createRun(threadId) {
        return await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID,
            tools
        });
    }

    async checkRunStatus(threadId, runId) {
        return await openai.beta.threads.runs.retrieve(threadId, runId);
    }

    async submitToolOutputs(threadId, runId, toolOutputs) {
        return await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: toolOutputs
        });
    }

    async getMessages(threadId) {
        return await openai.beta.threads.messages.list(threadId);
    }

    async processMessageContent(message) {
        return message.content.map(item => {
            if (item.type === 'text') {
                const text = item.text.value;
                const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                const processedContent = [];
                let lastIndex = 0;
                let match;

                while ((match = markdownImageRegex.exec(text)) !== null) {
                    if (match.index > lastIndex) {
                        processedContent.push({
                            type: 'text',
                            content: text.substring(lastIndex, match.index)
                        });
                    }

                    processedContent.push({
                        type: 'image',
                        content: match[2],
                        alt: match[1]
                    });

                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < text.length) {
                    processedContent.push({
                        type: 'text',
                        content: text.substring(lastIndex)
                    });
                }

                return processedContent;
            }
            return [{ type: item.type, content: item.text?.value }];
        }).flat();
    }
}

module.exports = new OpenAIService();