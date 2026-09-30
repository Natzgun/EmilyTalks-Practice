module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/features/conversation/lib/conversation-store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * In-memory conversation store (singleton for single-user dev mode).
 * Maintains full message history and applies truncation when MAX_MESSAGES is exceeded.
 */ __turbopack_context__.s([
    "store",
    ()=>store
]);
const MAX_MESSAGES = 10;
class ConversationStore {
    messages = [];
    scenario = "";
    topic = "";
    /**
   * Initialize a new conversation session.
   * Prepends the system prompt as the first message.
   */ init(scenario, topic, systemPrompt) {
        this.scenario = scenario;
        this.topic = topic;
        this.messages = [
            {
                role: "system",
                content: systemPrompt
            }
        ];
    }
    /**
   * Reset the store to a clean state. Idempotent.
   */ reset() {
        this.messages = [];
        this.scenario = "";
        this.topic = "";
    }
    /**
   * Append a user or assistant message to the history.
   */ addMessage(role, content) {
        this.messages.push({
            role,
            content
        });
    }
    /**
   * Return the full message array for sending to Ollama.
   * Applies truncation if the history exceeds MAX_MESSAGES,
   * always preserving the system prompt at index 0.
   */ getMessagesForOllama() {
        if (this.messages.length <= MAX_MESSAGES) {
            return [
                ...this.messages
            ];
        }
        // Keep system prompt (index 0) + most recent MAX_MESSAGES-1 messages
        const keep = MAX_MESSAGES - 1;
        console.warn(`[conversation-store] Truncating messages: ${this.messages.length} → ${MAX_MESSAGES}`);
        return [
            this.messages[0],
            ...this.messages.slice(-keep)
        ];
    }
    /**
   * Returns true if a session has been initialized (has at least a system message).
   */ isActive() {
        return this.messages.length > 0;
    }
    /**
   * Get the current scenario metadata (for debugging/logging).
   */ getMetadata() {
        return {
            scenario: this.scenario,
            topic: this.topic
        };
    }
}
const store = new ConversationStore();
}),
"[project]/src/features/conversation/lib/system-prompt.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildSystemPrompt",
    ()=>buildSystemPrompt,
    "getAvailableScenarios",
    ()=>getAvailableScenarios
]);
/**
 * System prompt builder.
 * Generates scenario-specific system prompts for the LLM.
 * Each scenario has a distinct persona and behavioral instructions.
 */ const BASE_INSTRUCTIONS = `Keep your answers short (no more than 2–3 sentences). ` + `Do not explain grammar rules unless the user asks. ` + `Avoid using parentheses, brackets, or code. ` + `Write in clear, natural spoken English. ` + `Do not mention that you are an AI or language model, You are Emily.`;
const SCENARIO_PROMPTS = {
    casual: (topic)=>`You are Emily, a friendly and conversational AI assistant. ` + `You are currently discussing "${topic}". ` + `Keep your responses natural, warm, and engaging. ` + `Ask follow-up questions to keep the conversation flowing. ` + BASE_INSTRUCTIONS,
    interview: (topic)=>`You are Emily, acting as a professional job interviewer. ` + `The interview topic is "${topic}". ` + `Ask thoughtful, structured interview questions. ` + `Provide constructive feedback when appropriate. ` + `Maintain a professional but encouraging tone. ` + BASE_INSTRUCTIONS,
    education: (topic)=>`You are Emily, an educational tutor specializing in "${topic}". ` + `Explain concepts clearly with examples. ` + `Encourage the student to think critically. ` + `Break down complex ideas into manageable pieces. ` + BASE_INSTRUCTIONS,
    storytelling: (topic)=>`You are Emily, a creative storyteller. ` + `The current story theme is "${topic}". ` + `Create vivid, imaginative narratives. ` + `Invite the user to contribute to the story. ` + `Use descriptive language and build suspense. ` + BASE_INSTRUCTIONS,
    debate: (topic)=>`You are Emily, a debate partner. ` + `The debate topic is "${topic}". ` + `Present well-reasoned arguments and counterarguments. ` + `Challenge the user's thinking respectfully. ` + `Encourage logical reasoning and evidence-based discussion. ` + BASE_INSTRUCTIONS
};
function buildSystemPrompt(scenario, topic) {
    const builder = SCENARIO_PROMPTS[scenario];
    if (builder) {
        return builder(topic);
    }
    // Fallback for unknown scenarios
    return `You are Emily, a friendly AI assistant. ` + `You are discussing "${topic}" in the "${scenario}" scenario. ` + `Be helpful, engaging, and responsive. ` + BASE_INSTRUCTIONS;
}
function getAvailableScenarios() {
    return Object.keys(SCENARIO_PROMPTS);
}
}),
"[project]/src/features/conversation/api/prepare-agent/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/lib/conversation-store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$system$2d$prompt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/lib/system-prompt.ts [app-route] (ecmascript)");
;
;
async function POST(req) {
    try {
        const body = await req.json();
        const { scenario, topic } = body;
        if (!scenario || !topic) {
            return Response.json({
                error: "scenario and topic are required"
            }, {
                status: 400
            });
        }
        const systemPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$system$2d$prompt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSystemPrompt"])(scenario, topic);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].init(scenario, topic, systemPrompt);
        return Response.json({
            status: "prepared"
        });
    } catch  {
        return Response.json({
            error: "Invalid request body"
        }, {
            status: 400
        });
    }
}
}),
"[project]/src/app/api/conversation/prepare-agent/route.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$api$2f$prepare$2d$agent$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/api/prepare-agent/route.ts [app-route] (ecmascript)");
;
}),
"[project]/src/app/api/conversation/prepare-agent/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$api$2f$prepare$2d$agent$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["POST"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$conversation$2f$prepare$2d$agent$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/app/api/conversation/prepare-agent/route.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$api$2f$prepare$2d$agent$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/api/prepare-agent/route.ts [app-route] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jyqgv2._.js.map