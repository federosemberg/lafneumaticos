// src/controllers/chat.controller.js
const openAIService = require('../services/openai.service');
const { tools } = require('../config/openai.config');
const googleSheets = require('../services/googleSheets.service');
const whatsapp = require('../services/whatsapp.service');
const ThreadManager = require('../utils/threadManager');

class ChatController {
    constructor() {
        this.threadManager = new ThreadManager();
    }

    async processMessage(from, message) {
        console.log('Procesando mensaje')
        let threadInfo = await this.threadManager.getThread(from);

        if (!threadInfo) {
            const userData = await googleSheets.checkUserExists(from);
            threadInfo = await this.threadManager.getOrCreateThread(from, userData);

            if (userData) {
                const messageContent = `Nota inicial: Este usuario se llama ${userData.firstName} ${userData.lastName} y sus apodo es ${userData.nickname} y es cliente tipo ${userData.clientType}. Siempre muestra los precios correspondientes a su tipo de cliente.`;
                await openAIService.createMessage(threadInfo.threadId, messageContent);
            }
        }

        const { threadId } = threadInfo;
        await openAIService.createMessage(threadId, message);
        const run = await openAIService.createRun(threadId);

        let runStatus = await openAIService.checkRunStatus(threadId, run.id);

        while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
            if (runStatus.status === 'requires_action') {
                const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => ({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(await this.handleFunctionCall(toolCall, from))
                })));

                runStatus = await openAIService.submitToolOutputs(threadId, run.id, toolOutputs);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openAIService.checkRunStatus(threadId, run.id);
        }

        const messages = await openAIService.getMessages(threadId);
        return openAIService.processMessageContent(messages.data[0]);
    }

    async handleFunctionCall(toolCall, from) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        const threadInfo = this.threadManager.getThread(from);

        switch (functionName) {
            case "check_stock":
                return await googleSheets.checkStock(args.product, args.size);
            case "check_price":
                return await googleSheets.checkPrice(args.product, args.size, threadInfo);
            case "make_reservation":
                return await googleSheets.makeReservation(from, args.product, args.size, args.quantity, threadInfo);
            case "msearch":
                return await googleSheets.searchProducts(args.query, args.size, threadInfo);
            case "cancel_reservation":
                return await googleSheets.cancelReservation(args.reference, from, threadInfo);
            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    }

    processMessageContent(message) {
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

    async handleHttpMessage(req, res) {
        console.log('por aqui')
        try {
            const { from, message } = req.query;
            const processedMessage = await this.processMessage(from, message);

            res.status(200).json({
                message: processedMessage,
                sessionId: this.threadManager.getThread(from)?.threadId
            });
        } catch (error) {
            console.error('Error en el controlador de chat:', error);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    }
}

module.exports = new ChatController();