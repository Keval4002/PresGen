import axios from "axios";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callLLM({ model, prompt, apiType = "gemini" }) {
  try {
    if (apiType === "gemini") {
      const apiKey = process.env.GEMINI_API;
      const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`;

      const body = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      const response = await axios.post(url, body);
      const text =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text;
    } else if (apiType === "groq") {
      const apiKey = process.env.GROQ_API_KEY;
      const url = GROQ_URL;

      const body = {
        model,
        messages: [{ role: "user", content: prompt }],
      };

      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const text = response.data.choices?.[0]?.message?.content || "";
      return text;
    } else {
      throw new Error("Unsupported Api Keys");
    }
  } catch (error) {
    console.error("callLLM error : ", error.response?.data || error.message);
    throw error;
  }
}

export { callLLM };
