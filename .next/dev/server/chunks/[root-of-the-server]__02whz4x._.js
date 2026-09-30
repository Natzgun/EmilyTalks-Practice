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
"[project]/src/features/conversation/lib/ollama-client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Shared Ollama client configuration.
 * Reads from environment variables with sensible defaults for dev mode.
 */ __turbopack_context__.s([
    "OLLAMA_MODEL",
    ()=>OLLAMA_MODEL,
    "OLLAMA_URL",
    ()=>OLLAMA_URL
]);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
}),
"[project]/src/features/conversation/api/converse/stream/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/lib/conversation-store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$ollama$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/lib/ollama-client.ts [app-route] (ecmascript)");
;
;
async function POST(req) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].isActive()) {
        return Response.json({
            error: "No active session. Call prepare-agent first."
        }, {
            status: 400
        });
    }
    let body;
    try {
        body = await req.json();
    } catch  {
        return Response.json({
            error: "Invalid request body"
        }, {
            status: 400
        });
    }
    if (!body.message) {
        return Response.json({
            error: "message is required"
        }, {
            status: 400
        });
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].addMessage("user", body.message);
    const encoder = new TextEncoder();
    let fullResponse = "";
    let ollamaRes;
    try {
        ollamaRes = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$ollama$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OLLAMA_URL"]}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$ollama$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OLLAMA_MODEL"],
                messages: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].getMessagesForOllama(),
                stream: true,
                options: {
                    num_predict: 80,
                    temperature: 0.7,
                    top_p: 0.9
                }
            })
        });
    } catch  {
        // Ollama unreachable — send error via SSE and close
        const errorStream = new ReadableStream({
            start (controller) {
                controller.enqueue(encoder.encode(`data:${JSON.stringify({
                    error: "Ollama unavailable"
                })}\n\n`));
                controller.close();
            }
        });
        return new Response(errorStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive"
            }
        });
    }
    if (!ollamaRes.ok || !ollamaRes.body) {
        const errorStream = new ReadableStream({
            start (controller) {
                controller.enqueue(encoder.encode(`data:${JSON.stringify({
                    error: "Ollama unavailable"
                })}\n\n`));
                controller.close();
            }
        });
        return new Response(errorStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive"
            }
        });
    }
    const stream = new ReadableStream({
        async start (controller) {
            const reader = ollamaRes.body.getReader();
            const decoder = new TextDecoder();
            try {
                while(true){
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value, {
                        stream: true
                    });
                    // Ollama returns NDJSON: one JSON object per line
                    for (const line of text.split("\n")){
                        if (!line.trim()) continue;
                        try {
                            const parsed = JSON.parse(line);
                            const content = parsed.message?.content;
                            if (content) {
                                fullResponse += content;
                                controller.enqueue(encoder.encode(`data:${content}\n\n`));
                            }
                        } catch  {
                        // Skip malformed NDJSON lines
                        }
                    }
                }
                // Append the full assistant response to the store
                if (fullResponse) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$lib$2f$conversation$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].addMessage("assistant", fullResponse);
                }
                controller.enqueue(encoder.encode("data:[DONE]\n\n"));
            } catch  {
                controller.enqueue(encoder.encode("data:[ERROR]\n\n"));
            } finally{
                controller.close();
            }
        }
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
        }
    });
}
}),
"[project]/src/app/api/conversation/converse/stream/route.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$api$2f$converse$2f$stream$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/api/converse/stream/route.ts [app-route] (ecmascript)");
;
}),
"[project]/src/app/api/conversation/converse/stream/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$api$2f$converse$2f$stream$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["POST"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$conversation$2f$converse$2f$stream$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/app/api/conversation/converse/stream/route.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$conversation$2f$api$2f$converse$2f$stream$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/conversation/api/converse/stream/route.ts [app-route] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02whz4x._.js.map