import { createServer, } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListResourceTemplatesRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve project root: prefer ASSETS_ROOT only if it actually has an assets/ directory
const DEFAULT_ROOT_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = (() => {
    const envRoot = process.env.ASSETS_ROOT;
    if (envRoot) {
        const candidate = path.resolve(envRoot);
        try {
            const candidateAssets = path.join(candidate, "assets");
            if (fs.existsSync(candidateAssets)) {
                return candidate;
            }
        }
        catch {
            // fall through to default
        }
    }
    return DEFAULT_ROOT_DIR;
})();
const ASSETS_DIR = path.resolve(ROOT_DIR, "assets");
const LOGS_DIR = path.resolve(__dirname, "..", "logs");
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}
function logAnalytics(event, data = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        event,
        ...data,
    };
    const logLine = JSON.stringify(entry);
    console.log(logLine);
    const today = new Date().toISOString().split("T")[0];
    const logFile = path.join(LOGS_DIR, `${today}.log`);
    fs.appendFileSync(logFile, logLine + "\n");
}
function getRecentLogs(days = 7) {
    const logs = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const logFile = path.join(LOGS_DIR, `${dateStr}.log`);
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, "utf8");
            const lines = content.trim().split("\n");
            lines.forEach((line) => {
                try {
                    logs.push(JSON.parse(line));
                }
                catch (e) { }
            });
        }
    }
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
function classifyDevice(userAgent) {
    if (!userAgent)
        return "Unknown";
    const ua = userAgent.toLowerCase();
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
        return "iOS";
    if (ua.includes("android"))
        return "Android";
    if (ua.includes("mac os") || ua.includes("macintosh"))
        return "macOS";
    if (ua.includes("windows"))
        return "Windows";
    if (ua.includes("linux"))
        return "Linux";
    if (ua.includes("cros"))
        return "ChromeOS";
    return "Other";
}
function computeSummary(args) {
    // Compute travel safety summary
    const location = args.location || args.city || args.country || "Not specified";
    const country = args.country || "";
    const city = args.city || "";
    // Determine query type
    let queryType = "general";
    if (city && country)
        queryType = "city";
    else if (city)
        queryType = "city";
    else if (country)
        queryType = "country";
    return {
        location,
        country,
        city,
        query_type: queryType,
        data_sources: ["US State Dept", "UK Foreign Office", "GDELT News", "ACLED Conflict Data"],
    };
}
function readWidgetHtml(componentName) {
    if (!fs.existsSync(ASSETS_DIR)) {
        throw new Error(`Widget assets not found. Expected directory ${ASSETS_DIR}. Run "pnpm run build" before starting the server.`);
    }
    const directPath = path.join(ASSETS_DIR, `${componentName}.html`);
    let htmlContents = null;
    let loadedFrom = "";
    if (fs.existsSync(directPath)) {
        htmlContents = fs.readFileSync(directPath, "utf8");
        loadedFrom = directPath;
    }
    else {
        const candidates = fs
            .readdirSync(ASSETS_DIR)
            .filter((file) => file.startsWith(`${componentName}-`) && file.endsWith(".html"))
            .sort();
        const fallback = candidates[candidates.length - 1];
        if (fallback) {
            const fallbackPath = path.join(ASSETS_DIR, fallback);
            htmlContents = fs.readFileSync(fallbackPath, "utf8");
            loadedFrom = fallbackPath;
        }
    }
    if (!htmlContents) {
        throw new Error(`Widget HTML for "${componentName}" not found in ${ASSETS_DIR}. Run "pnpm run build" to generate the assets.`);
    }
    // Log what was loaded and check for "5%" in the badge
    const has5Percent = htmlContents.includes('<span class="rate-num">5%</span>');
    const isBlank = htmlContents.includes('<span class="rate-num"></span>');
    console.log(`[Widget Load] File: ${loadedFrom}`);
    console.log(`[Widget Load] Has "5%": ${has5Percent}, Is Blank: ${isBlank}`);
    console.log(`[Widget Load] HTML length: ${htmlContents.length} bytes`);
    return htmlContents;
}
// Use git commit hash for deterministic cache-busting across deploys
// Added timestamp suffix to force cache invalidation for width fix
const VERSION = (process.env.RENDER_GIT_COMMIT?.slice(0, 7) || Date.now().toString()) + '-' + Date.now();
function widgetMeta(widget, bustCache = false) {
    const templateUri = bustCache
        ? `ui://widget/is_it_safe.html?v=${VERSION}`
        : widget.templateUri;
    return {
        "openai/outputTemplate": templateUri,
        "openai/widgetDescription": "A travel safety tool that provides real-time safety data for any city or country. Shows official travel advisories from US State Department and UK Foreign Office, recent conflict data from ACLED, and news sentiment analysis from GDELT. Call this tool immediately with NO arguments to let the user search for a location manually. Only provide arguments if the user has explicitly stated a location.",
        "openai/componentDescriptions": {
            "search-form": "Search input for entering a city or country name to check safety data.",
            "safety-dashboard": "Dashboard showing advisory levels, risk scores, and safety information from multiple sources.",
            "news-analysis": "Recent news headlines and sentiment analysis for the searched location.",
        },
        "openai/widgetKeywords": [
            "travel safety",
            "is it safe",
            "travel advisory",
            "danger",
            "risk",
            "travel warning",
            "state department",
            "foreign office",
            "conflict",
            "crime",
            "safety data",
            "travel risk"
        ],
        "openai/sampleConversations": [
            { "user": "Is it safe to travel to Egypt?", "assistant": "Here is the safety data for Egypt, including US State Department advisories and recent news analysis." },
            { "user": "How dangerous is Mexico City right now?", "assistant": "I'll show you the current safety situation for Mexico City with data from official government sources and conflict monitoring." },
            { "user": "What's the travel advisory for Thailand?", "assistant": "Here's the travel advisory information for Thailand from both US and UK government sources." },
        ],
        "openai/starterPrompts": [
            "Is it safe to travel to Egypt?",
            "What's the travel advisory for Thailand?",
            "How safe is Mexico City?",
            "Is Colombia dangerous right now?",
            "Travel warnings for Israel",
            "Safety information for Paris",
            "Is it safe to visit Brazil?",
        ],
        "openai/widgetPrefersBorder": true,
        "openai/widgetCSP": {
            connect_domains: [
                "https://travelsafety-un15.onrender.com",
                "https://nominatim.openstreetmap.org",
                "https://api.open-meteo.com",
                "https://geocoding-api.open-meteo.com",
                "http://localhost:8001"
            ],
            resource_domains: [
                "https://travelsafety-un15.onrender.com"
            ],
        },
        "openai/widgetDomain": "https://web-sandbox.oaiusercontent.com",
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": true,
        "openai/resultCanProduceWidget": true,
    };
}
const widgets = [
    {
        id: "is-it-safe",
        title: "Is It Safe? — Real-time travel safety data for any city or country",
        templateUri: `ui://widget/is_it_safe.html?v=${VERSION}`,
        invoking: "Opening Is It Safe?...",
        invoked: "Here is Is It Safe? Search any city or country to get real-time travel safety data from official government sources.",
        html: readWidgetHtml("is_it_safe"),
    },
];
const widgetsById = new Map();
const widgetsByUri = new Map();
widgets.forEach((widget) => {
    widgetsById.set(widget.id, widget);
    widgetsByUri.set(widget.templateUri, widget);
});
const toolInputSchema = {
    type: "object",
    properties: {
        location: { type: "string", description: "Location to check safety for (city, country, or region)." },
        country: { type: "string", description: "Country name to check safety data for." },
        city: { type: "string", description: "City name to check safety data for." },
        include_news: { type: "boolean", description: "Whether to include recent news analysis from GDELT." },
        include_conflict: { type: "boolean", description: "Whether to include conflict data from ACLED." },
    },
    required: [],
    additionalProperties: false,
    $schema: "http://json-schema.org/draft-07/schema#",
};
const toolInputParser = z.object({
    location: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    include_news: z.boolean().optional(),
    include_conflict: z.boolean().optional(),
});
const tools = widgets.map((widget) => ({
    name: widget.id,
    description: "Use this tool to check travel safety data for any city or country. Shows official travel advisories from US State Department and UK Foreign Office, conflict data from ACLED, and news analysis from GDELT. Call this tool immediately with NO arguments to let the user search for a location manually. Only provide arguments if the user has explicitly stated a location.",
    inputSchema: toolInputSchema,
    outputSchema: {
        type: "object",
        properties: {
            ready: { type: "boolean" },
            timestamp: { type: "string" },
            location: { type: "string" },
            country: { type: "string" },
            city: { type: "string" },
            input_source: { type: "string", enum: ["user", "default"] },
            summary: {
                type: "object",
                properties: {
                    location: { type: ["string", "null"] },
                    country: { type: ["string", "null"] },
                    city: { type: ["string", "null"] },
                    query_type: { type: ["string", "null"] },
                    data_sources: { type: "array", items: { type: "string" } },
                },
            },
            suggested_followups: {
                type: "array",
                items: { type: "string" },
            },
        },
    },
    title: widget.title,
    securitySchemes: [{ type: "noauth" }],
    _meta: {
        ...widgetMeta(widget),
        securitySchemes: [{ type: "noauth" }],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
    },
}));
const resources = widgets.map((widget) => ({
    uri: widget.templateUri,
    name: widget.title,
    description: "HTML template for the Is It Safe travel safety widget that provides real-time safety data for cities and countries.",
    mimeType: "text/html+skybridge",
    _meta: widgetMeta(widget),
}));
const resourceTemplates = widgets.map((widget) => ({
    uriTemplate: widget.templateUri,
    name: widget.title,
    description: "Template descriptor for the Is It Safe travel safety widget.",
    mimeType: "text/html+skybridge",
    _meta: widgetMeta(widget),
}));
function createTravelSafetyServer() {
    const server = new Server({
        name: "is-it-safe",
        version: "0.1.0",
        description: "Is It Safe provides real-time travel safety data for any city or country, including official government advisories, conflict data, and news analysis.",
    }, {
        capabilities: {
            resources: {},
            tools: {},
        },
    });
    server.setRequestHandler(ListResourcesRequestSchema, async (_request) => {
        console.log(`[MCP] resources/list called, returning ${resources.length} resources`);
        resources.forEach((r) => {
            console.log(`  - ${r.uri} (${r.name})`);
        });
        return { resources };
    });
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const widget = widgetsByUri.get(request.params.uri);
        if (!widget) {
            throw new Error(`Unknown resource: ${request.params.uri}`);
        }
        // Inject current FRED rate into HTML before sending to ChatGPT
        // (Logic removed for yield optimizer)
        const htmlToSend = widget.html;
        return {
            contents: [
                {
                    uri: widget.templateUri,
                    mimeType: "text/html+skybridge",
                    text: htmlToSend,
                    _meta: widgetMeta(widget),
                },
            ],
        };
    });
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async (_request) => ({ resourceTemplates }));
    server.setRequestHandler(ListToolsRequestSchema, async (_request) => ({ tools }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const startTime = Date.now();
        let userAgentString = null;
        let deviceCategory = "Unknown";
        // Log the full request to debug _meta location
        console.log("Full request object:", JSON.stringify(request, null, 2));
        try {
            const widget = widgetsById.get(request.params.name);
            if (!widget) {
                logAnalytics("tool_call_error", {
                    error: "Unknown tool",
                    toolName: request.params.name,
                });
                throw new Error(`Unknown tool: ${request.params.name}`);
            }
            // Parse and validate input parameters
            let args = {};
            try {
                args = toolInputParser.parse(request.params.arguments ?? {});
            }
            catch (parseError) {
                logAnalytics("parameter_parse_error", {
                    toolName: request.params.name,
                    params: request.params.arguments,
                    error: parseError.message,
                });
                throw parseError;
            }
            // Capture user context from _meta - try multiple locations
            const meta = request._meta || request.params?._meta || {};
            const userLocation = meta["openai/userLocation"];
            const userLocale = meta["openai/locale"];
            const userAgent = meta["openai/userAgent"];
            userAgentString = typeof userAgent === "string" ? userAgent : null;
            deviceCategory = classifyDevice(userAgentString);
            // Debug log
            console.log("Captured meta:", { userLocation, userLocale, userAgent });
            // If ChatGPT didn't pass structured arguments, try to infer travel details from freeform text in meta
            try {
                const candidates = [
                    meta["openai/subject"],
                    meta["openai/userPrompt"],
                    meta["openai/userText"],
                    meta["openai/lastUserMessage"],
                    meta["openai/inputText"],
                    meta["openai/requestText"],
                ];
                const userText = candidates.find((t) => typeof t === "string" && t.trim().length > 0) || "";
                // Try to infer location from user text (e.g., "safe to travel to Egypt", "dangerous in Mexico City")
                if (args.location === undefined && args.country === undefined && args.city === undefined) {
                    // Match patterns like "safe to travel to X", "is X safe", "dangerous in X", "safety of X"
                    const locationPatterns = [
                        /(?:safe|dangerous|safety|risk|travel|visit|go)\s+(?:to|in|for|of)\s+([A-Za-z\s,]+?)(?:\?|\.|,|right now|\s*$)/i,
                        /(?:is|how)\s+([A-Za-z\s,]+?)\s+(?:safe|dangerous|risky)/i,
                        /(?:travel\s+)?(?:advisory|warning)\s+(?:for|in)\s+([A-Za-z\s,]+?)(?:\?|\.|,|\s*$)/i,
                    ];
                    for (const pattern of locationPatterns) {
                        const match = userText.match(pattern);
                        if (match) {
                            const inferredLocation = match[1].trim();
                            // Check if it looks like a city (contains spaces or common city indicators)
                            if (/city|town|metro/i.test(inferredLocation) || /\s/.test(inferredLocation)) {
                                args.city = inferredLocation;
                            }
                            else {
                                // Assume country if single word
                                args.country = inferredLocation;
                            }
                            args.location = inferredLocation;
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.warn("Parameter inference from meta failed", e);
            }
            const responseTime = Date.now() - startTime;
            // Check if we are using defaults (i.e. no arguments provided)
            const usedDefaults = Object.keys(args).length === 0;
            // Infer likely user query from parameters
            const inferredQuery = [];
            if (args.location)
                inferredQuery.push(`Location: ${args.location}`);
            if (args.country)
                inferredQuery.push(`Country: ${args.country}`);
            if (args.city)
                inferredQuery.push(`City: ${args.city}`);
            logAnalytics("tool_call_success", {
                toolName: request.params.name,
                params: args,
                inferredQuery: inferredQuery.length > 0 ? inferredQuery.join(", ") : "Travel Safety Search",
                responseTime,
                device: deviceCategory,
                userLocation: userLocation
                    ? {
                        city: userLocation.city,
                        region: userLocation.region,
                        country: userLocation.country,
                        timezone: userLocation.timezone,
                    }
                    : null,
                userLocale,
                userAgent,
            });
            // Use a stable template URI so toolOutput reliably hydrates the component
            const widgetMetadata = widgetMeta(widget, false);
            console.log(`[MCP] Tool called: ${request.params.name}, returning templateUri: ${widgetMetadata["openai/outputTemplate"]}`);
            // Build structured content once so we can log it and return it.
            // For travel safety, expose fields relevant to location safety data
            const structured = {
                ready: true,
                timestamp: new Date().toISOString(),
                ...args,
                input_source: usedDefaults ? "default" : "user",
                // Summary + follow-ups for natural language UX
                summary: computeSummary(args),
                suggested_followups: [
                    "What are the main safety concerns?",
                    "Is it safe for solo travelers?",
                    "What areas should I avoid?",
                    "Are there any recent incidents?"
                ],
            };
            // Embed the widget resource in _meta to mirror official examples and improve hydration reliability
            const metaForReturn = {
                ...widgetMetadata,
                "openai.com/widget": {
                    type: "resource",
                    resource: {
                        uri: widget.templateUri,
                        mimeType: "text/html+skybridge",
                        text: widget.html,
                        title: widget.title,
                    },
                },
            };
            console.log("[MCP] Returning outputTemplate:", metaForReturn["openai/outputTemplate"]);
            console.log("[MCP] Returning structuredContent:", structured);
            // Log success analytics
            try {
                // Check for "empty" result - when no location inputs are provided
                const hasMainInputs = args.location || args.country || args.city;
                if (!hasMainInputs) {
                    logAnalytics("tool_call_empty", {
                        toolName: request.params.name,
                        params: request.params.arguments || {},
                        reason: "No location provided"
                    });
                }
                else {
                    logAnalytics("tool_call_success", {
                        responseTime,
                        params: request.params.arguments || {},
                        inferredQuery: inferredQuery.join(", "),
                        userLocation,
                        userLocale,
                        device: deviceCategory,
                    });
                }
            }
            catch { }
            return {
                content: [],
                structuredContent: structured,
                _meta: metaForReturn,
            };
        }
        catch (error) {
            logAnalytics("tool_call_error", {
                error: error.message,
                stack: error.stack,
                responseTime: Date.now() - startTime,
                device: deviceCategory,
                userAgent: userAgentString,
            });
            throw error;
        }
    });
    return server;
}
const sessions = new Map();
const ssePath = "/mcp";
const postPath = "/mcp/messages";
const subscribePath = "/api/subscribe";
const analyticsPath = "/analytics";
const trackEventPath = "/api/track";
const healthPath = "/health";
const gdeltProxyPath = "/api/gdelt";
const acledProxyPath = "/api/acled";
const ukProxyPath = "/api/uk";
const sentimentPath = "/api/sentiment";
// Community sentiment storage
const SENTIMENT_FILE = path.join(LOGS_DIR, "sentiment.json");
function loadSentiment() {
    try {
        if (fs.existsSync(SENTIMENT_FILE)) {
            return JSON.parse(fs.readFileSync(SENTIMENT_FILE, "utf-8"));
        }
    }
    catch (e) {
        console.error("Failed to load sentiment data:", e);
    }
    return {};
}
function saveSentiment(data) {
    try {
        fs.writeFileSync(SENTIMENT_FILE, JSON.stringify(data, null, 2));
    }
    catch (e) {
        console.error("Failed to save sentiment data:", e);
    }
}
function getSentiment(location) {
    const data = loadSentiment();
    const key = location.toLowerCase().trim();
    return data[key] || { safe: 0, unsafe: 0 };
}
function voteSentiment(location, isSafe) {
    const data = loadSentiment();
    const key = location.toLowerCase().trim();
    if (!data[key]) {
        data[key] = { safe: 0, unsafe: 0 };
    }
    if (isSafe) {
        data[key].safe++;
    }
    else {
        data[key].unsafe++;
    }
    saveSentiment(data);
    return data[key];
}
async function handleSentiment(req, res, url) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    const location = url.searchParams.get("location");
    if (!location) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing location parameter" }));
        return;
    }
    if (req.method === "GET") {
        const sentiment = getSentiment(location);
        const total = sentiment.safe + sentiment.unsafe;
        const safePercent = total > 0 ? Math.round((sentiment.safe / total) * 100) : 50;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ...sentiment, total, safePercent }));
        return;
    }
    if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                const { vote } = JSON.parse(body);
                if (vote !== "safe" && vote !== "unsafe") {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Invalid vote. Must be 'safe' or 'unsafe'" }));
                    return;
                }
                const sentiment = voteSentiment(location, vote === "safe");
                const total = sentiment.safe + sentiment.unsafe;
                const safePercent = total > 0 ? Math.round((sentiment.safe / total) * 100) : 50;
                logAnalytics("sentiment_vote", { location, vote });
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ...sentiment, total, safePercent }));
            }
            catch (e) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON body" }));
            }
        });
        return;
    }
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
}
const domainVerificationPath = "/.well-known/openai-apps-challenge";
const domainVerificationToken = process.env.OPENAI_DOMAIN_VERIFICATION_TOKEN ??
    "U7I2UA8J7ha5MpDAmi2F0dFnC75L4XY5QMXwU3jpcsU";
const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD || "changeme123";
function checkAnalyticsAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return false;
    }
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
    const [username, password] = credentials.split(":");
    return username === "admin" && password === ANALYTICS_PASSWORD;
}
function humanizeEventName(event) {
    const eventMap = {
        tool_call_success: "Tool Call Success",
        tool_call_error: "Tool Call Error",
        parameter_parse_error: "Parameter Parse Error",
        widget_carousel_prev: "Carousel Previous",
        widget_carousel_next: "Carousel Next",
        widget_filter_age_change: "Filter: Age Change",
        widget_filter_state_change: "Filter: State Change",
        widget_filter_sort_change: "Filter: Sort Change",
        widget_filter_category_change: "Filter: Category Change",
        widget_user_feedback: "User Feedback",
        widget_test_event: "Test Event",
        widget_followup_click: "Follow-up Click",
        widget_crash: "Widget Crash",
    };
    return eventMap[event] || event;
}
function formatEventDetails(log) {
    const excludeKeys = ["timestamp", "event"];
    const details = {};
    Object.keys(log).forEach((key) => {
        if (!excludeKeys.includes(key)) {
            details[key] = log[key];
        }
    });
    if (Object.keys(details).length === 0) {
        return "—";
    }
    return JSON.stringify(details, null, 0);
}
function evaluateAlerts(logs) {
    const alerts = [];
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    // 1. Tool Call Failures
    const toolErrors24h = logs.filter((l) => l.event === "tool_call_error" &&
        new Date(l.timestamp).getTime() >= dayAgo).length;
    if (toolErrors24h > 5) {
        alerts.push({
            id: "tool-errors",
            level: "critical",
            message: `Tool failures in last 24h: ${toolErrors24h} (>5 threshold)`,
        });
    }
    // 2. Parameter Parsing Errors
    const parseErrorsWeek = logs.filter((l) => l.event === "parameter_parse_error" &&
        new Date(l.timestamp).getTime() >= weekAgo).length;
    if (parseErrorsWeek > 3) {
        alerts.push({
            id: "parse-errors",
            level: "warning",
            message: `Parameter parse errors in last 7d: ${parseErrorsWeek} (>3 threshold)`,
        });
    }
    // 3. Empty Result Sets (or equivalent for calculator - e.g. missing inputs)
    const successCalls = logs.filter((l) => l.event === "tool_call_success" && new Date(l.timestamp).getTime() >= weekAgo);
    const emptyResults = logs.filter((l) => l.event === "tool_call_empty" && new Date(l.timestamp).getTime() >= weekAgo).length;
    const totalCalls = successCalls.length + emptyResults;
    if (totalCalls > 0 && (emptyResults / totalCalls) > 0.2) {
        alerts.push({
            id: "empty-results",
            level: "warning",
            message: `Empty result rate ${((emptyResults / totalCalls) * 100).toFixed(1)}% (>20% threshold)`,
        });
    }
    // 4. Widget Load Failures (Crashes)
    const widgetCrashes = logs.filter((l) => l.event === "widget_crash" && new Date(l.timestamp).getTime() >= dayAgo).length;
    if (widgetCrashes > 0) {
        alerts.push({
            id: "widget-crash",
            level: "critical",
            message: `Widget crashes in last 24h: ${widgetCrashes} (Fix immediately)`,
        });
    }
    // 5. Buttondown Subscription Failures
    const recentSubs = logs.filter((l) => (l.event === "widget_notify_me_subscribe" ||
        l.event === "widget_notify_me_subscribe_error") &&
        new Date(l.timestamp).getTime() >= weekAgo);
    const subFailures = recentSubs.filter((l) => l.event === "widget_notify_me_subscribe_error").length;
    const failureRate = recentSubs.length > 0 ? subFailures / recentSubs.length : 0;
    if (recentSubs.length >= 5 && failureRate > 0.1) {
        alerts.push({
            id: "buttondown-failures",
            level: "warning",
            message: `Buttondown failure rate ${(failureRate * 100).toFixed(1)}% over last 7d (${subFailures}/${recentSubs.length})`,
        });
    }
    return alerts;
}
function generateAnalyticsDashboard(logs, alerts) {
    const errorLogs = logs.filter((l) => l.event.includes("error"));
    const successLogs = logs.filter((l) => l.event === "tool_call_success");
    const parseLogs = logs.filter((l) => l.event === "parameter_parse_error");
    const widgetEvents = logs.filter((l) => l.event.startsWith("widget_"));
    const avgResponseTime = successLogs.length > 0
        ? (successLogs.reduce((sum, l) => sum + (l.responseTime || 0), 0) /
            successLogs.length).toFixed(0)
        : "N/A";
    const paramUsage = {};
    const countryDist = {};
    const cityDist = {};
    successLogs.forEach((log) => {
        if (log.params) {
            Object.keys(log.params).forEach((key) => {
                if (log.params[key] !== undefined) {
                    paramUsage[key] = (paramUsage[key] || 0) + 1;
                }
            });
            // Track country distribution
            if (log.params.country) {
                const country = log.params.country;
                countryDist[country] = (countryDist[country] || 0) + 1;
            }
            // Track city distribution
            if (log.params.city) {
                const city = log.params.city;
                cityDist[city] = (cityDist[city] || 0) + 1;
            }
        }
    });
    const widgetInteractions = {};
    widgetEvents.forEach((log) => {
        const humanName = humanizeEventName(log.event);
        widgetInteractions[humanName] = (widgetInteractions[humanName] || 0) + 1;
    });
    // Location distribution (top searched locations)
    const locationDist = {};
    successLogs.forEach((log) => {
        if (log.params?.location) {
            const loc = log.params.location;
            locationDist[loc] = (locationDist[loc] || 0) + 1;
        }
    });
    // Safety Actions
    const actionCounts = {
        "Search Location": 0,
        "Subscribe": 0,
        "View Advisory": 0,
        "View News": 0,
        "View Conflict Data": 0,
        "Share": 0
    };
    widgetEvents.forEach(log => {
        if (log.event === "widget_search_location")
            actionCounts["Search Location"]++;
        if (log.event === "widget_notify_me_subscribe")
            actionCounts["Subscribe"]++;
        if (log.event === "widget_view_advisory")
            actionCounts["View Advisory"]++;
        if (log.event === "widget_view_news")
            actionCounts["View News"]++;
        if (log.event === "widget_view_conflict")
            actionCounts["View Conflict Data"]++;
        if (log.event === "widget_share")
            actionCounts["Share"]++;
    });
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Is It Safe Analytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h2 { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 10px; }
    .card .value { font-size: 32px; font-weight: bold; color: #1a1a1a; }
    .card.error .value { color: #dc2626; }
    .card.success .value { color: #16a34a; }
    .card.warning .value { color: #ea580c; }
    table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; }
    td { color: #1f2937; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    .error-row { background: #fef2f2; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .timestamp { color: #9ca3af; font-size: 12px; }
    td strong { color: #1f2937; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Is It Safe Analytics</h1>
    <p class="subtitle">Last 7 days • Auto-refresh every 60s</p>
    
    <div class="grid">
      <div class="card ${alerts.length ? "warning" : ""}">
        <h2>Alerts</h2>
        ${alerts.length
        ? `<ul style="padding-left:16px;margin:0;">${alerts
            .map((a) => `<li><strong>${a.level.toUpperCase()}</strong> — ${a.message}</li>`)
            .join("")}</ul>`
        : '<p style="color:#16a34a;">No active alerts</p>'}
      </div>
      <div class="card success">
        <h2>Total Calls</h2>
        <div class="value">${successLogs.length}</div>
      </div>
      <div class="card error">
        <h2>Errors</h2>
        <div class="value">${errorLogs.length}</div>
      </div>
      <div class="card warning">
        <h2>Parse Errors</h2>
        <div class="value">${parseLogs.length}</div>
      </div>
      <div class="card">
        <h2>Avg Response Time</h2>
        <div class="value">${avgResponseTime}<span style="font-size: 16px; color: #666;">ms</span></div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2>Parameter Usage</h2>
      <table>
        <thead><tr><th>Parameter</th><th>Times Used</th><th>Usage %</th></tr></thead>
        <tbody>
          ${Object.entries(paramUsage)
        .sort((a, b) => b[1] - a[1])
        .map(([param, count]) => `
            <tr>
              <td><code>${param}</code></td>
              <td>${count}</td>
              <td>${((count / successLogs.length) * 100).toFixed(1)}%</td>
            </tr>
          `)
        .join("")}
        </tbody>
      </table>
    </div>

    <div class="grid" style="margin-bottom: 20px;">
      <div class="card">
        <h2>Top Countries</h2>
        <table>
          <thead><tr><th>Country</th><th>Searches</th></tr></thead>
          <tbody>
            ${Object.entries(countryDist).length > 0 ? Object.entries(countryDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => `
              <tr>
                <td>${country}</td>
                <td>${count}</td>
              </tr>
            `)
        .join("") : '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No data yet</td></tr>'}
          </tbody>
        </table>
      </div>
      
       <div class="card">
        <h2>User Actions</h2>
        <table>
          <thead><tr><th>Action</th><th>Count</th></tr></thead>
          <tbody>
            ${Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([action, count]) => `
              <tr>
                <td>${action}</td>
                <td>${count}</td>
              </tr>
            `)
        .join("")}
          </tbody>
        </table>
      </div>
    </div>


    <div class="card" style="margin-bottom: 20px;">
      <h2>Widget Interactions</h2>
      <table>
        <thead><tr><th>Action</th><th>Count</th></tr></thead>
        <tbody>
          ${Object.entries(widgetInteractions).length > 0 ? Object.entries(widgetInteractions)
        .sort((a, b) => b[1] - a[1])
        .map(([action, count]) => `
            <tr>
              <td>${action}</td>
              <td>${count}</td>
            </tr>
          `)
        .join("") : '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No data yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="grid" style="margin-bottom: 20px;">
      <div class="card">
        <h2>Top Cities</h2>
        <table>
          <thead><tr><th>City</th><th>Searches</th></tr></thead>
          <tbody>
            ${Object.entries(cityDist).length > 0 ? Object.entries(cityDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([city, count]) => `
              <tr>
                <td>${city}</td>
                <td>${count}</td>
              </tr>
            `)
        .join("") : '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No data yet</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="card">
        <h2>Top Locations</h2>
        <table>
          <thead><tr><th>Location</th><th>Searches</th></tr></thead>
          <tbody>
            ${Object.entries(locationDist).length > 0 ? Object.entries(locationDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([loc, count]) => `
              <tr>
                <td>${loc}</td>
                <td>${count}</td>
              </tr>
            `)
        .join("") : '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No data yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2>User Queries (Inferred from Tool Calls)</h2>
      <table>
        <thead><tr><th>Date</th><th>Query</th><th>Location</th><th>Locale</th></tr></thead>
        <tbody>
          ${successLogs.length > 0 ? successLogs
        .slice(0, 20)
        .map((log) => `
            <tr>
              <td class="timestamp" style="white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</td>
              <td style="max-width: 400px;">${log.inferredQuery || "general search"}</td>
              <td style="font-size: 12px; color: #6b7280;">${log.userLocation ? `${log.userLocation.city || ''}, ${log.userLocation.region || ''}, ${log.userLocation.country || ''}`.replace(/^, |, $/g, '') : '—'}</td>
              <td style="font-size: 12px; color: #6b7280;">${log.userLocale || '—'}</td>
            </tr>
          `)
        .join("") : '<tr><td colspan="4" style="text-align: center; color: #9ca3af;">No queries yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2>User Feedback</h2>
      <table>
        <thead><tr><th>Date</th><th>Feedback</th></tr></thead>
        <tbody>
          ${logs.filter(l => l.event === "widget_user_feedback").length > 0 ? logs
        .filter(l => l.event === "widget_user_feedback")
        .slice(0, 20)
        .map((log) => `
            <tr>
              <td class="timestamp" style="white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</td>
              <td style="max-width: 600px;">${log.feedback || "—"}</td>
            </tr>
          `)
        .join("") : '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No feedback yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Recent Events (Last 50)</h2>
      <table>
        <thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead>
        <tbody>
          ${logs
        .slice(0, 50)
        .map((log) => `
            <tr class="${log.event.includes("error") ? "error-row" : ""}">
              <td class="timestamp">${new Date(log.timestamp).toLocaleString()}</td>
              <td><strong>${humanizeEventName(log.event)}</strong></td>
              <td style="font-size: 12px; max-width: 600px; overflow: hidden; text-overflow: ellipsis;">${formatEventDetails(log)}</td>
            </tr>
          `)
        .join("")}
        </tbody>
      </table>
    </div>
  </div>
  <script>setTimeout(() => location.reload(), 60000);</script>
</body>
</html>`;
}
async function handleAnalytics(req, res) {
    if (!checkAnalyticsAuth(req)) {
        res.writeHead(401, {
            "WWW-Authenticate": 'Basic realm="Analytics Dashboard"',
            "Content-Type": "text/plain",
        });
        res.end("Authentication required");
        return;
    }
    try {
        const logs = getRecentLogs(7);
        const alerts = evaluateAlerts(logs);
        alerts.forEach((alert) => console.warn("[ALERT]", alert.id, alert.message));
        const html = generateAnalyticsDashboard(logs, alerts);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    }
    catch (error) {
        console.error("Analytics error:", error);
        res.writeHead(500).end("Failed to generate analytics");
    }
}
function sendJson(res, status, body) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
}
let acledTokenCache = null;
async function getAcledAccessToken() {
    const username = process.env.ACLED_USERNAME;
    const password = process.env.ACLED_PASSWORD;
    if (!username || !password) {
        throw new Error("ACLED_USERNAME and ACLED_PASSWORD must be configured");
    }
    const now = Date.now();
    if (acledTokenCache && now < acledTokenCache.expiresAt) {
        return acledTokenCache.accessToken;
    }
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);
    body.set("grant_type", "password");
    body.set("client_id", "acled");
    const tokenRes = await fetch("https://acleddata.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    if (!tokenRes.ok) {
        const text = await tokenRes.text().catch(() => "");
        throw new Error(`ACLED OAuth token request failed: ${tokenRes.status} ${text}`);
    }
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    const expiresIn = Number(tokenJson?.expires_in ?? 0);
    if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
        throw new Error("ACLED OAuth token response missing access_token or expires_in");
    }
    // Refresh slightly before actual expiry
    const expiresAt = now + expiresIn * 1000 - 60_000;
    acledTokenCache = { accessToken, expiresAt };
    return accessToken;
}
async function handleGdeltProxy(req, res, url) {
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
        });
        res.end();
        return;
    }
    if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
    }
    const location = url.searchParams.get("location")?.trim();
    if (!location) {
        sendJson(res, 400, { error: "Missing location" });
        return;
    }
    // GDELT query syntax is picky; strip punctuation (e.g. commas) that can trigger "illegal character".
    const sanitizedLocation = location
        .replace(/[|]/g, " ")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
    // Treat as a phrase search to reduce parsing issues.
    const gdeltQuery = sanitizedLocation ? `\"${sanitizedLocation}\"` : "";
    try {
        const upstream = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(gdeltQuery)}&mode=artlist&maxrecords=50&format=json&timespan=7d`);
        if (!upstream.ok) {
            const errorText = await upstream.text().catch(() => "");
            sendJson(res, 502, { error: "GDELT upstream error", status: upstream.status, details: errorText });
            return;
        }
        const rawText = await upstream.text().catch(() => "");
        let data;
        try {
            data = JSON.parse(rawText);
        }
        catch {
            sendJson(res, 502, {
                error: "GDELT upstream error",
                status: 502,
                details: rawText ? rawText.slice(0, 500) : "Non-JSON response from GDELT",
            });
            return;
        }
        const articles = Array.isArray(data?.articles) ? data.articles : [];
        const tones = articles.map((a) => Number(a?.tone ?? 0)).filter((t) => Number.isFinite(t));
        const avgTone = tones.length ? tones.reduce((a, b) => a + b, 0) / tones.length : 0;
        const headlines = articles.slice(0, 5).map((a) => ({
            title: a?.title || "Untitled",
            url: a?.url || "",
            source: a?.domain || "Unknown",
            date: a?.seendate || new Date().toISOString(),
            tone: Number(a?.tone ?? 0),
        }));
        const volumeLevel = articles.length > 50 ? "spike" : articles.length > 20 ? "elevated" : "normal";
        const trend7d = avgTone > 0 ? "improving" : avgTone < -5 ? "worsening" : "stable";
        sendJson(res, 200, {
            location,
            country: "",
            tone_score: Math.round(avgTone * 10) / 10,
            volume_level: volumeLevel,
            article_count_24h: articles.length,
            themes: {},
            headlines,
            trend_7day: trend7d,
            last_updated: new Date().toISOString(),
        });
    }
    catch (error) {
        sendJson(res, 500, { error: "Failed to fetch GDELT", message: error?.message || String(error) });
    }
}
async function handleAcledProxy(req, res, url) {
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
        });
        res.end();
        return;
    }
    if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
    }
    const country = url.searchParams.get("country")?.trim();
    if (!country) {
        sendJson(res, 400, { error: "Missing country" });
        return;
    }
    try {
        const accessToken = await getAcledAccessToken();
        console.log(`[ACLED] Got access token (first 20 chars): ${accessToken.substring(0, 20)}...`);
        const currentYear = new Date().getFullYear();
        const upstream = await fetch(`https://acleddata.com/api/acled/read?_format=json&country=${encodeURIComponent(country)}&year=${currentYear}&fields=event_type|fatalities|event_date&limit=500`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        if (!upstream.ok) {
            const errorText = await upstream.text().catch(() => "");
            console.error(`[ACLED] Upstream error ${upstream.status}:`, errorText);
            sendJson(res, 502, { error: "ACLED upstream error", status: upstream.status, details: errorText });
            return;
        }
        const data = await upstream.json();
        const events = Array.isArray(data?.data) ? data.data : Array.isArray(data?.data?.data) ? data.data.data : [];
        const eventTypes = {};
        let totalFatalities = 0;
        for (const ev of events) {
            const type = ev?.event_type || "Unknown";
            eventTypes[type] = (eventTypes[type] || 0) + 1;
            const f = parseInt(ev?.fatalities ?? "0", 10);
            totalFatalities += Number.isFinite(f) ? f : 0;
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEvents = events.filter((e) => {
            const d = new Date(e?.event_date);
            return !Number.isNaN(d.getTime()) && d >= thirtyDaysAgo;
        }).length;
        sendJson(res, 200, {
            country,
            total_events: events.length,
            fatalities: totalFatalities,
            events_last_30_days: recentEvents,
            event_types: eventTypes,
            last_updated: new Date().toISOString(),
            trend: recentEvents > events.length / 12 ? "increasing" : "stable",
        });
    }
    catch (error) {
        console.error("[ACLED] Proxy error:", error);
        sendJson(res, 500, { error: "Failed to fetch ACLED", message: error?.message || String(error) });
    }
}
async function handleUkProxy(req, res, url) {
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
        });
        res.end();
        return;
    }
    if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
    }
    const country = url.searchParams.get("country")?.trim();
    if (!country) {
        sendJson(res, 400, { error: "Missing country" });
        return;
    }
    try {
        const upstream = await fetch(`https://www.gov.uk/api/content/foreign-travel-advice/${encodeURIComponent(country)}`);
        if (!upstream.ok) {
            sendJson(res, 502, { error: "UK upstream error", status: upstream.status });
            return;
        }
        const data = await upstream.json();
        if (!data?.details) {
            sendJson(res, 404, { error: "UK advice missing details" });
            return;
        }
        sendJson(res, 200, {
            country: data?.title || country,
            alert_status: data?.details?.alert_status || [],
            change_description: data?.details?.change_description || "",
            last_updated: data?.public_updated_at || new Date().toISOString(),
            url: data?.web_url || `https://www.gov.uk/foreign-travel-advice/${country}`,
        });
    }
    catch (error) {
        sendJson(res, 500, { error: "Failed to fetch UK advice", message: error?.message || String(error) });
    }
}
async function handleTrackEvent(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") {
        res.writeHead(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.writeHead(405).end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }
    try {
        let body = "";
        for await (const chunk of req) {
            body += chunk;
        }
        const { event, data } = JSON.parse(body);
        if (!event) {
            res.writeHead(400).end(JSON.stringify({ error: "Missing event name" }));
            return;
        }
        logAnalytics(`widget_${event}`, data || {});
        res.writeHead(200).end(JSON.stringify({ success: true }));
    }
    catch (error) {
        console.error("Track event error:", error);
        res.writeHead(500).end(JSON.stringify({ error: "Failed to track event" }));
    }
}
// Buttondown API integration
async function subscribeToButtondown(email, topicId, topicName) {
    const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
    console.log("[Buttondown] subscribeToButtondown called", { email, topicId, topicName });
    console.log("[Buttondown] API key present:", !!BUTTONDOWN_API_KEY, "length:", BUTTONDOWN_API_KEY?.length ?? 0);
    if (!BUTTONDOWN_API_KEY) {
        throw new Error("BUTTONDOWN_API_KEY not set in environment variables");
    }
    const metadata = {
        topicName,
        source: "is-it-safe",
        subscribedAt: new Date().toISOString(),
    };
    const requestBody = {
        email_address: email,
        tags: [topicId],
        metadata,
    };
    console.log("[Buttondown] Sending request body:", JSON.stringify(requestBody));
    const response = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
            "Authorization": `Token ${BUTTONDOWN_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });
    console.log("[Buttondown] Response status:", response.status, response.statusText);
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to subscribe";
        try {
            const errorData = JSON.parse(errorText);
            if (errorData.detail) {
                errorMessage = errorData.detail;
            }
            else if (errorData.code) {
                errorMessage = `Error: ${errorData.code}`;
            }
        }
        catch {
            errorMessage = errorText;
        }
        throw new Error(errorMessage);
    }
    return await response.json();
}
// Update existing subscriber with new topic
async function updateButtondownSubscriber(email, topicId, topicName) {
    const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
    if (!BUTTONDOWN_API_KEY) {
        throw new Error("BUTTONDOWN_API_KEY not set in environment variables");
    }
    // First, get the subscriber ID
    const searchResponse = await fetch(`https://api.buttondown.email/v1/subscribers?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
            "Authorization": `Token ${BUTTONDOWN_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
    if (!searchResponse.ok) {
        throw new Error("Failed to find subscriber");
    }
    const subscribers = await searchResponse.json();
    if (!subscribers.results || subscribers.results.length === 0) {
        throw new Error("Subscriber not found");
    }
    const subscriber = subscribers.results[0];
    const subscriberId = subscriber.id;
    // Update the subscriber with new tag and metadata
    const existingTags = subscriber.tags || [];
    const existingMetadata = subscriber.metadata || {};
    // Add new topic to tags if not already there
    const updatedTags = existingTags.includes(topicId) ? existingTags : [...existingTags, topicId];
    // Add new topic to metadata (Buttondown requires string values)
    const topicKey = `topic_${topicId}`;
    const topicData = JSON.stringify({
        name: topicName,
        subscribedAt: new Date().toISOString(),
    });
    const updatedMetadata = {
        ...existingMetadata,
        [topicKey]: topicData,
        source: "is-it-safe",
    };
    const updateRequestBody = {
        tags: updatedTags,
        metadata: updatedMetadata,
    };
    console.log("[Buttondown] updateButtondownSubscriber called", { email, topicId, topicName, subscriberId });
    console.log("[Buttondown] Sending update request body:", JSON.stringify(updateRequestBody));
    const updateResponse = await fetch(`https://api.buttondown.email/v1/subscribers/${subscriberId}`, {
        method: "PATCH",
        headers: {
            "Authorization": `Token ${BUTTONDOWN_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updateRequestBody),
    });
    console.log("[Buttondown] Update response status:", updateResponse.status, updateResponse.statusText);
    if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update subscriber: ${errorText}`);
    }
    return await updateResponse.json();
}
async function handleSubscribe(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") {
        res.writeHead(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.writeHead(405).end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }
    try {
        let body = "";
        for await (const chunk of req) {
            body += chunk;
        }
        // Support both old (settlementId/settlementName) and new (topicId/topicName) field names
        const parsed = JSON.parse(body);
        const email = parsed.email;
        const topicId = parsed.topicId || parsed.settlementId || "is-it-safe";
        const topicName = parsed.topicName || parsed.settlementName || "Is It Safe Updates";
        if (!email || !email.includes("@")) {
            res.writeHead(400).end(JSON.stringify({ error: "Invalid email address" }));
            return;
        }
        const BUTTONDOWN_API_KEY_PRESENT = !!process.env.BUTTONDOWN_API_KEY;
        if (!BUTTONDOWN_API_KEY_PRESENT) {
            res.writeHead(500).end(JSON.stringify({ error: "Server misconfigured: BUTTONDOWN_API_KEY missing" }));
            return;
        }
        try {
            await subscribeToButtondown(email, topicId, topicName);
            res.writeHead(200).end(JSON.stringify({
                success: true,
                message: "Successfully subscribed! You'll receive travel safety updates and alerts."
            }));
        }
        catch (subscribeError) {
            const rawMessage = String(subscribeError?.message ?? "").trim();
            const msg = rawMessage.toLowerCase();
            const already = msg.includes('already subscribed') || msg.includes('already exists') || msg.includes('already on your list') || msg.includes('subscriber already exists') || msg.includes('already');
            if (already) {
                console.log("Subscriber already on list, attempting update", { email, topicId, message: rawMessage });
                try {
                    await updateButtondownSubscriber(email, topicId, topicName);
                    res.writeHead(200).end(JSON.stringify({
                        success: true,
                        message: "You're now subscribed to this topic!"
                    }));
                }
                catch (updateError) {
                    console.warn("Update subscriber failed, returning graceful success", {
                        email,
                        topicId,
                        error: updateError?.message,
                    });
                    logAnalytics("widget_notify_me_subscribe_error", {
                        stage: "update",
                        email,
                        error: updateError?.message,
                    });
                    res.writeHead(200).end(JSON.stringify({
                        success: true,
                        message: "You're already subscribed! We'll keep you posted.",
                    }));
                }
                return;
            }
            logAnalytics("widget_notify_me_subscribe_error", {
                stage: "subscribe",
                email,
                error: rawMessage || "unknown_error",
            });
            throw subscribeError;
        }
    }
    catch (error) {
        console.error("Subscribe error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        logAnalytics("widget_notify_me_subscribe_error", {
            stage: "handler",
            email: undefined,
            error: error.message || "unknown_error",
        });
        res.writeHead(500).end(JSON.stringify({
            error: error.message || "Failed to subscribe. Please try again."
        }));
    }
}
async function handleSseRequest(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const server = createTravelSafetyServer();
    const transport = new SSEServerTransport(postPath, res);
    const sessionId = transport.sessionId;
    sessions.set(sessionId, { server, transport });
    transport.onclose = async () => {
        sessions.delete(sessionId);
        await server.close();
    };
    transport.onerror = (error) => {
        console.error("SSE transport error", error);
    };
    try {
        await server.connect(transport);
    }
    catch (error) {
        sessions.delete(sessionId);
        console.error("Failed to start SSE session", error);
        if (!res.headersSent) {
            res.writeHead(500).end("Failed to establish SSE connection");
        }
    }
}
async function handlePostMessage(req, res, url) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
        res.writeHead(400).end("Missing sessionId query parameter");
        return;
    }
    const session = sessions.get(sessionId);
    if (!session) {
        res.writeHead(404).end("Unknown session");
        return;
    }
    try {
        await session.transport.handlePostMessage(req, res);
    }
    catch (error) {
        console.error("Failed to process message", error);
        if (!res.headersSent) {
            res.writeHead(500).end("Failed to process message");
        }
    }
}
const portEnv = Number(process.env.PORT ?? 8001);
const port = Number.isFinite(portEnv) ? portEnv : 8001;
const httpServer = createServer(async (req, res) => {
    if (!req.url) {
        res.writeHead(400).end("Missing URL");
        return;
    }
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "OPTIONS" &&
        (url.pathname === ssePath ||
            url.pathname === postPath ||
            url.pathname === gdeltProxyPath ||
            url.pathname === acledProxyPath ||
            url.pathname === ukProxyPath ||
            url.pathname === sentimentPath)) {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
        });
        res.end();
        return;
    }
    if (req.method === "GET" && url.pathname === healthPath) {
        res.writeHead(200, { "Content-Type": "text/plain" }).end("OK");
        return;
    }
    if (req.method === "GET" && url.pathname === domainVerificationPath) {
        res.writeHead(200, { "Content-Type": "text/plain" }).end(domainVerificationToken);
        return;
    }
    if (req.method === "GET" && url.pathname === ssePath) {
        await handleSseRequest(res);
        return;
    }
    if (req.method === "POST" && url.pathname === postPath) {
        await handlePostMessage(req, res, url);
        return;
    }
    if (url.pathname === subscribePath) {
        await handleSubscribe(req, res);
        return;
    }
    if (url.pathname === analyticsPath) {
        await handleAnalytics(req, res);
        return;
    }
    if (url.pathname === trackEventPath) {
        await handleTrackEvent(req, res);
        return;
    }
    if (url.pathname === gdeltProxyPath) {
        await handleGdeltProxy(req, res, url);
        return;
    }
    if (url.pathname === acledProxyPath) {
        await handleAcledProxy(req, res, url);
        return;
    }
    if (url.pathname === ukProxyPath) {
        await handleUkProxy(req, res, url);
        return;
    }
    if (url.pathname === sentimentPath) {
        await handleSentiment(req, res, url);
        return;
    }
    // Serve alias for legacy loader path -> our main widget HTML
    if (req.method === "GET" && url.pathname === "/assets/is_it_safe.html") {
        const mainAssetPath = path.join(ASSETS_DIR, "is_it_safe.html");
        console.log(`[Debug Legacy] Request: ${url.pathname}, Main Path: ${mainAssetPath}, Exists: ${fs.existsSync(mainAssetPath)}`);
        if (fs.existsSync(mainAssetPath) && fs.statSync(mainAssetPath).isFile()) {
            res.writeHead(200, {
                "Content-Type": "text/html",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache",
            });
            fs.createReadStream(mainAssetPath).pipe(res);
            return;
        }
    }
    // Serve static assets from /assets directory
    if (req.method === "GET" && url.pathname.startsWith("/assets/")) {
        const assetPath = path.join(ASSETS_DIR, url.pathname.slice(8));
        if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
            const ext = path.extname(assetPath).toLowerCase();
            const contentTypeMap = {
                ".js": "application/javascript",
                ".css": "text/css",
                ".html": "text/html",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".gif": "image/gif",
                ".webp": "image/webp",
                ".svg": "image/svg+xml"
            };
            const contentType = contentTypeMap[ext] || "application/octet-stream";
            res.writeHead(200, {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache"
            });
            fs.createReadStream(assetPath).pipe(res);
            return;
        }
    }
    res.writeHead(404).end("Not Found");
});
httpServer.on("clientError", (err, socket) => {
    console.error("HTTP client error", err);
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});
function startMonitoring() {
    // Check alerts every hour
    setInterval(() => {
        try {
            const logs = getRecentLogs(7);
            const alerts = evaluateAlerts(logs);
            if (alerts.length > 0) {
                console.log("\n=== 🚨 ACTIVE ALERTS 🚨 ===");
                alerts.forEach(alert => {
                    console.log(`[ALERT] [${alert.level.toUpperCase()}] ${alert.message}`);
                });
                console.log("===========================\n");
            }
        }
        catch (e) {
            console.error("Monitoring check failed:", e);
        }
    }, 60 * 60 * 1000); // 1 hour
}
httpServer.listen(port, () => {
    startMonitoring();
    console.log(`Is It Safe MCP server listening on http://localhost:${port}`);
    console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
    console.log(`  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`);
});
