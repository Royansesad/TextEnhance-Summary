const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt, mode } = req.body;

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API key not configured" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const enhanceMode = mode || "general";

        const systemPrompts = {
            general: `You are an expert prompt engineer. Take the user's raw prompt and rewrite it into a clear, effective prompt.

RULES:
1. Keep it CONCISE — maximum 10-15 lines
2. Analyze intent even if the original is vague or grammatically incorrect
3. Add clear objective, context, and expected output format
4. Add a role assignment if helpful (e.g., "Act as a...")
5. Keep the same language as the input
6. DO NOT answer the prompt — only rewrite/enhance it
7. Return ONLY the enhanced prompt, nothing else`,

            creative: `You are a creative prompt engineer. Rewrite the user's raw prompt into a vivid, creatively powerful prompt.

RULES:
1. Keep it CONCISE — maximum 10-15 lines
2. Add mood, tone, style, and aesthetic direction
3. Preserve original intent but amplify creativity
4. Keep the same language as the input
5. DO NOT answer the prompt — only rewrite/enhance it
6. Return ONLY the enhanced prompt, nothing else`,

            technical: `You are a technical prompt engineer. Rewrite the user's raw prompt into a precise, structured technical prompt.

RULES:
1. Keep it CONCISE — maximum 10-15 lines
2. Add technical specs: objective, requirements, constraints, expected output
3. Specify edge cases briefly
4. Keep the same language as the input
5. DO NOT answer the prompt — only rewrite/enhance it
6. Return ONLY the enhanced prompt, nothing else`,

            academic: `You are an academic prompt engineer. Rewrite the user's raw prompt into a scholarly, well-structured prompt.

RULES:
1. Keep it CONCISE — maximum 10-15 lines
2. Add academic context and methodology direction
3. Include citation/evidence requirements briefly
4. Keep the same language as the input
5. DO NOT answer the prompt — only rewrite/enhance it
6. Return ONLY the enhanced prompt, nothing else`
        };

        const selectedSystem = systemPrompts[enhanceMode] || systemPrompts.general;

        const fullPrompt = `${selectedSystem}

---

RAW PROMPT TO ENHANCE:
"${prompt}"

---

ENHANCED PROMPT:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const enhancedText = response.text();

        return res.status(200).json({
            success: true,
            original: prompt,
            enhanced: enhancedText,
            mode: enhanceMode
        });

    } catch (error) {
        console.error("Enhancement error:", error);
        return res.status(500).json({
            error: "Failed to enhance prompt",
            details: error.message
        });
    }
};