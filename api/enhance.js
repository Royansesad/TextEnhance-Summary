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
        const { prompt, mode, type } = req.body;

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ error: "Content is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API key not configured" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const enhanceMode = mode || "general";
        const contentType = type || "prompt";

        // === System Prompts by Content Type ===
        const systemPrompts = {
            // --- PROMPT Enhancement ---
            prompt: {
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
            },

            // --- TEXT Enhancement ---
            text: {
                general: `You are an expert editor and writing clarity specialist. Take the user's raw text and rewrite it to be clearer, more polished, and well-structured.

RULES:
1. Fix grammar, spelling, and punctuation errors
2. Improve sentence structure and flow for better readability
3. Clarify vague or confusing passages while preserving the original meaning
4. Organize ideas logically — improve paragraph structure if needed
5. Keep the same language as the input
6. Output ONLY the enhanced, polished text — no explanations, no comments
7. Maintain the original tone unless it's clearly too informal/formal for the context
8. Do NOT add new information that isn't implied by the original text`,

                creative: `You are a creative writing editor. Take the user's raw text and rewrite it with richer, more engaging language while keeping the core message.

RULES:
1. Enhance vocabulary with more vivid, expressive word choices
2. Add sentence variety — short punchy sentences mixed with longer flowing ones
3. Improve rhythm and flow to make it more pleasurable to read
4. Fix grammar and spelling while keeping creative flair
5. Keep the same language as the input
6. Output ONLY the enhanced text — no explanations, no comments
7. Preserve the writer's voice but elevate it`,

                technical: `You are a technical writing specialist. Take the user's raw text and rewrite it for maximum precision and technical clarity.

RULES:
1. Use precise, unambiguous language — eliminate vagueness
2. Structure with clear logical flow: premise → explanation → conclusion
3. Fix any factual inconsistencies or logical gaps you can detect
4. Use proper technical terminology appropriate to the subject
5. Keep the same language as the input
6. Output ONLY the enhanced text — no explanations, no comments
7. Make complex ideas accessible without oversimplifying`,

                academic: `You are an academic writing specialist. Take the user's raw text and rewrite it in a polished academic style.

RULES:
1. Use formal, scholarly language appropriate for academic writing
2. Improve argument structure and logical flow
3. Eliminate colloquialisms, slang, and overly casual phrasing
4. Ensure objectivity and neutrality in tone
5. Keep the same language as the input
6. Output ONLY the enhanced text — no explanations, no comments
7. Strengthen thesis statements and supporting evidence where present`
            },

            // --- STORY Enhancement ---
            story: {
                general: `You are an expert fiction editor and story enhancer. Take the user's rough story and rewrite it with better flow, richer descriptions, and more engaging narrative — while keeping the same plot, characters, and events.

RULES:
1. Improve narrative flow — smooth transitions between scenes and paragraphs
2. Enrich descriptions — add sensory details (sight, sound, smell, touch, taste) where appropriate
3. Strengthen character voice and dialogue if present
4. Fix grammar, spelling, and awkward phrasing
5. Keep the same language as the input
6. Output ONLY the enhanced story — no explanations, no comments, no meta-commentary
7. Preserve the original plot, characters, and events — enhance, don't change the story
8. Maintain the author's intended tone and style but elevate it`,

                creative: `You are a master creative writing editor. Take the user's rough story and transform it into a vivid, immersive, and emotionally resonant piece of fiction.

RULES:
1. Add rich, evocative descriptions — make the reader SEE, HEAR, and FEEL the story
2. Enhance dialogue to feel natural and reveal character personality
3. Improve pacing — build tension, create rhythm, add dramatic beats
4. Use literary techniques: metaphor, simile, foreshadowing, imagery
5. Keep the same language as the input
6. Output ONLY the enhanced story — no explanations, no comments
7. Preserve the original plot and characters but elevate the prose dramatically
8. Make every paragraph compelling to read`
            }
        };

        // Get the appropriate system prompt
        const typePrompts = systemPrompts[contentType] || systemPrompts.prompt;
        const selectedSystem = typePrompts[enhanceMode] || typePrompts.general;

        // Build the full prompt
        const inputLabel = contentType === 'story' ? 'STORY' : contentType === 'text' ? 'TEXT' : 'PROMPT';
        const outputLabel = contentType === 'prompt' ? 'ENHANCED PROMPT' : `ENHANCED ${inputLabel}`;

        const fullPrompt = `${selectedSystem}

---

RAW ${inputLabel} TO ENHANCE:
"${prompt}"

---

${outputLabel}:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const enhancedText = response.text();

        return res.status(200).json({
            success: true,
            original: prompt,
            enhanced: enhancedText,
            mode: enhanceMode,
            type: contentType
        });

    } catch (error) {
        console.error("Enhancement error:", error);
        return res.status(500).json({
            error: "Failed to enhance content",
            details: error.message
        });
    }
};