const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
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
    const { text, mode, length } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const summaryLength = length || "medium";

    const lengthGuide = {
      short: "Keep it very concise, maximum 2-3 sentences.",
      medium: "Provide a balanced summary, around 1-2 short paragraphs.",
      long: "Provide a comprehensive and detailed summary, 3-4 paragraphs."
    };

    const modePrompts = {
      narrative: `You are an expert storyteller and narrator. Summarize the following text in a NARRATIVE style.

RULES:
- Write as if telling a story — use flowing, engaging prose
- Include a beginning, middle, and end structure
- Use transitional phrases and narrative hooks
- Make it engaging and readable like a story
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting`,

      descriptive: `You are a master of descriptive writing. Summarize the following text in a DESCRIPTIVE style.

RULES:
- Use vivid, detailed, and sensory-rich language
- Paint a picture with words — describe concepts thoroughly
- Include adjectives and expressive phrases
- Make the reader visualize and feel the content
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting`,

      formal: `You are a professional academic writer. Summarize the following text in a FORMAL style.

RULES:
- Use professional, academic, and formal language
- Maintain objectivity and neutrality
- Use proper terminology and structured sentences
- Avoid colloquialisms, slang, or casual expressions
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting`,

      bullet: `You are an expert at organizing information. Summarize the following text using BULLET POINTS.

RULES:
- Extract all key points and present them as bullet points
- Use hierarchical structure (main points and sub-points)
- Each bullet should be clear and self-contained
- Organize logically by theme or chronology
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting with • or - for bullets`,

      eli5: `You are an expert at explaining complex things simply. Summarize the following text in ELI5 (Explain Like I'm 5) style.

RULES:
- Use extremely simple, everyday language
- Use analogies and comparisons a child would understand
- Avoid jargon and technical terms entirely
- Make it fun and engaging
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting`,

      analytical: `You are a critical analyst and researcher. Summarize the following text in an ANALYTICAL style.

RULES:
- Break down the text into its core arguments/components
- Identify strengths, weaknesses, and key implications
- Provide critical analysis, not just description
- Include cause-effect relationships and logical connections
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting`,

      persuasive: `You are a master persuasive writer. Summarize the following text in a PERSUASIVE style.

RULES:
- Highlight the most compelling and impactful points
- Use persuasive language and rhetorical techniques
- Build a convincing narrative around the key message
- Include strong opening and closing statements
- ${lengthGuide[summaryLength]}
- Keep the same language as the input text
- Use markdown formatting`
    };

    const selectedMode = modePrompts[mode] || modePrompts.formal;

    const fullPrompt = `${selectedMode}

---

TEXT TO SUMMARIZE:
"${text}"

---

SUMMARY:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const summaryText = response.text();

    return res.status(200).json({
      success: true,
      original: text,
      summary: summaryText,
      mode: mode || "formal",
      length: summaryLength
    });

  } catch (error) {
    console.error("Summary error:", error);
    return res.status(500).json({
      error: "Failed to summarize text",
      details: error.message
    });
  }
};