"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orchestrator_1 = require("../lib/orchestrator");
async function testOrchestrator() {
    const orchestrator = new orchestrator_1.AgentOrchestrator();
    const queries = [
        "What is the price of Bitcoin?",
        "What are the trending tokens?",
        "What is a gas fee?", // Conceptual
    ];
    for (const query of queries) {
        console.log('\nTesting query:', query);
        try {
            const result = await orchestrator.processQuery(query);
            console.log('Result:', JSON.stringify(result, null, 2));
        }
        catch (error) {
            console.error('Error:', error);
        }
    }
}
testOrchestrator().catch(console.error);
