const { openai } = require('../config/openai.config');

class ThreadManager {
    constructor() {
        this.userThreads = new Map();
    }

    async getOrCreateThread(from, userData = null) {
        if (!this.userThreads.has(from)) {
            const thread = await openai.beta.threads.create();
            this.userThreads.set(from, { threadId: thread.id, userData });
        }
        return this.userThreads.get(from);
    }

    getThread(from) {
        return this.userThreads.get(from);
    }
}

// Exportar la clase en lugar de una instancia
module.exports = ThreadManager;