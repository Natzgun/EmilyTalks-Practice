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
"[project]/src/features/speech/lib/speech-client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getWorkerBaseUrl",
    ()=>getWorkerBaseUrl,
    "healthCheck",
    ()=>healthCheck,
    "synthesize",
    ()=>synthesize,
    "transcribe",
    ()=>transcribe
]);
/**
 * Thin client for the Python speech worker.
 * Builds URLs from PYTHON_WORKER_PORT env var and handles retries.
 */ const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
function getWorkerBaseUrl() {
    const port = process.env.PYTHON_WORKER_PORT;
    if (!port) {
        throw new Error("PYTHON_WORKER_PORT is not set. Is the dev script running?");
    }
    return `http://127.0.0.1:${port}`;
}
async function fetchWithRetry(url, init, retries = MAX_RETRIES) {
    let lastError = null;
    for(let i = 0; i <= retries; i++){
        try {
            const res = await fetch(url, {
                ...init,
                signal: init.signal ?? AbortSignal.timeout(30_000)
            });
            return res;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (i < retries) {
                await new Promise((r)=>setTimeout(r, RETRY_DELAY_MS * (i + 1)));
            }
        }
    }
    throw lastError ?? new Error("Speech worker unreachable after retries");
}
async function transcribe(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    const res = await fetchWithRetry(`${getWorkerBaseUrl()}/transcribe`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) {
        throw new Error(`Transcription failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
}
async function synthesize(text, voice) {
    const res = await fetchWithRetry(`${getWorkerBaseUrl()}/synthesize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            voice
        })
    });
    if (!res.ok) {
        throw new Error(`Synthesis failed: ${res.status} ${res.statusText}`);
    }
    return res.blob();
}
async function healthCheck() {
    try {
        const res = await fetch(`${getWorkerBaseUrl()}/health`, {
            signal: AbortSignal.timeout(5_000)
        });
        return res.ok;
    } catch  {
        return false;
    }
}
}),
"[project]/src/features/speech/api/synthesize/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$speech$2f$lib$2f$speech$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/speech/lib/speech-client.ts [app-route] (ecmascript)");
;
async function POST(req) {
    try {
        const body = await req.json();
        const { text } = body;
        if (!text || typeof text !== "string" || !text.trim()) {
            return Response.json({
                error: "text is required and must be a non-empty string"
            }, {
                status: 400
            });
        }
        const { voice } = body;
        const audioBlob = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$speech$2f$lib$2f$speech$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["synthesize"])(text.trim(), voice);
        return new Response(audioBlob, {
            headers: {
                "Content-Type": "audio/wav"
            }
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message.includes("PYTHON_WORKER_PORT")) {
            return Response.json({
                error: "Speech worker unavailable"
            }, {
                status: 503
            });
        }
        return Response.json({
            error: `Synthesis failed: ${message}`
        }, {
            status: 502
        });
    }
}
}),
"[project]/src/app/api/speech/synthesize/route.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$speech$2f$api$2f$synthesize$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/speech/api/synthesize/route.ts [app-route] (ecmascript)");
;
}),
"[project]/src/app/api/speech/synthesize/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$speech$2f$api$2f$synthesize$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["POST"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$speech$2f$synthesize$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/app/api/speech/synthesize/route.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$speech$2f$api$2f$synthesize$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/speech/api/synthesize/route.ts [app-route] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0fdt~io._.js.map