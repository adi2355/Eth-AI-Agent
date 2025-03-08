"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = buildContext;
function buildContext(messages) {
    const topics = new Set();
    const favoriteTokens = new Set();
    const preferredTimeframes = new Set();
    messages.forEach(msg => {
        if (msg.metadata?.intent) {
            topics.add(msg.metadata.intent);
        }
        if (msg.metadata?.tokens) {
            msg.metadata.tokens.forEach(token => favoriteTokens.add(token));
        }
    });
    return {
        recentMessages: messages.slice(-5),
        topics: Array.from(topics),
        userPreferences: {
            favoriteTokens: Array.from(favoriteTokens),
            preferredTimeframes: Array.from(preferredTimeframes)
        }
    };
}
