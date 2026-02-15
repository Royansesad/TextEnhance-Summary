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
      general: `You are an elite prompt engineer with 10+ years of experience crafting perfect prompts for AI systems. Your task is to take a raw, messy, unclear, or poorly written prompt and transform it into a powerful, crystal-clear, highly effective prompt.

RULES:
1. Analyze the user's intent even if the original prompt is vague, broken, or grammatically incorrect
2. Restructure it with clear objectives, context, constraints, and expected output format
3. Add specificity — who, what, when, where, why, how
4. Include role assignment if beneficial (e.g., "Act as a...")
5. Add output formatting instructions (bullet points, steps, paragraphs, etc.)
6. Preserve the original intent but make it 10x more powerful
7. Use markdown formatting for the enhanced prompt
8. If the prompt is in a specific language, keep the enhanced version in that same language
9. DO NOT answer the prompt — only ENHANCE it

OUTPUT FORMAT:
Return ONLY the enhanced prompt, nothing else. No explanations, no "Here's your enhanced prompt" — just the prompt itself.`,

      creative: `You are a world-class creative prompt engineer. Transform the given raw prompt into a vivid, imaginative, and creatively powerful prompt that will produce extraordinary creative outputs.

RULES:
1. Add rich descriptive language and creative direction
2. Include mood, tone, style, and aesthetic guidance
3. Add sensory details and atmospheric elements
4. Structure for maximum creative inspiration
5. Preserve original intent but amplify creativity 10x
6. Use markdown formatting
7. Keep the same language as the input
8. DO NOT answer the prompt — only ENHANCE it

Return ONLY the enhanced prompt.`,

      technical: `You are a senior technical prompt engineer. Transform the given raw prompt into a precise, technically rigorous, and highly structured prompt optimized for technical/coding/analytical tasks.

RULES:
1. Add technical specifications and constraints
2. Include expected input/output formats
3. Specify edge cases and error handling requirements
4. Add performance and quality criteria
5. Structure with clear sections: Objective, Requirements, Constraints, Expected Output
6. Preserve original intent but make it technically bulletproof
7. Use markdown formatting
8. Keep the same language as the input
9. DO NOT answer the prompt — only ENHANCE it

Return ONLY the enhanced prompt.`,

      academic: `You are an academic prompt engineering specialist. Transform the given raw prompt into a scholarly, well-structured, and academically rigorous prompt.

RULES:
1. Add academic context and theoretical framework
2. Include methodology specifications
3. Specify citation and evidence requirements
4. Add critical thinking and analysis directives
5. Structure with clear academic sections
6. Preserve original intent but elevate to academic standards
7. Use markdown formatting
8. Keep the same language as the input
9. DO NOT answer the prompt — only ENHANCE it

Return ONLY the enhanced prompt.`
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