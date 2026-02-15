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
            general: `You are an expert prompt engineer. Take the user's raw prompt and transform it into a well-structured, effective AI prompt.

RULES:
1. Analyze the user's intent even if the original is vague or poorly written
2. Restructure with: role assignment, clear objective, context, constraints, and expected output format
3. Add specificity — who, what, why, and how
4. Use markdown formatting for structure
5. Keep the same language as the input
6. Aim for 15-25 lines — detailed enough to be useful, short enough to be practical
7. DO NOT answer the prompt — only ENHANCE it
8. Return ONLY the enhanced prompt. No explanations or preamble.`,

            creative: `You are a creative prompt engineer. Transform the user's raw prompt into an imaginative, creatively powerful prompt.

RULES:
1. Add creative direction: mood, tone, style, and aesthetic guidance
2. Include vivid descriptive language and sensory elements
3. Structure for maximum creative inspiration with clear sections
4. Preserve original intent but amplify creativity significantly
5. Keep the same language as the input
6. Aim for 15-25 lines — rich but focused
7. DO NOT answer the prompt — only ENHANCE it
8. Return ONLY the enhanced prompt. No explanations or preamble.`,

            technical: `You are a technical prompt engineer. Transform the user's raw prompt into a precise, well-structured technical prompt.

RULES:
1. Structure with clear sections: Objective, Requirements, Constraints, Expected Output
2. Add technical specifications and input/output formats
3. Include edge cases and error handling requirements briefly
4. Add performance and quality criteria where relevant
5. Keep the same language as the input
6. Aim for 15-25 lines — thorough but not bloated
7. DO NOT answer the prompt — only ENHANCE it
8. Return ONLY the enhanced prompt. No explanations or preamble.`,

            academic: `You are an academic prompt engineer. Transform the user's raw prompt into a scholarly, well-structured academic prompt.

RULES:
1. Add academic context, theoretical framework, and methodology direction
2. Include citation and evidence requirements
3. Add critical thinking and analysis directives
4. Structure with clear academic sections
5. Keep the same language as the input
6. Aim for 15-25 lines — rigorous but focused
7. DO NOT answer the prompt — only ENHANCE it
8. Return ONLY the enhanced prompt. No explanations or preamble.`
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