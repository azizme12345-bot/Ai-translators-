import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server configuration error: GEMINI_API_KEY is missing." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const MODELS_TO_TRY = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash"
      ];

      const prompt = `You are a professional, high-accuracy translator.
Translate the following input text directly into ${targetLanguage}${sourceLanguage && sourceLanguage !== "Auto Detect" ? ` from ${sourceLanguage}` : ""}.

Strict Requirements:
1. The translated text MUST strictly be in ${targetLanguage}.
2. For Urdu: Output MUST be in proper Urdu script (نستعلیق / اردو رسم الخط). Convert phonetic/Roman Urdu or Devanagari/Hindi into standard Urdu script.
3. For Hindi: Output MUST be in Devanagari script.
4. For English: Output MUST be in English.
5. For Arabic: Output MUST be in Arabic script.
6. Provide ONLY the translated output. Do NOT include quotes, pronunciation guides, transliterations, conversational preamble, or explanations.

Input text to translate:
"""
${text}
"""`;

      let lastError: any = null;
      let translationText = "";

      for (const modelName of MODELS_TO_TRY) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.1,
            }
          });

          if (response.text) {
            translationText = response.text.trim();
            // Remove accidental surrounding quotation marks
            if (
              (translationText.startsWith('"') && translationText.endsWith('"')) ||
              (translationText.startsWith('“') && translationText.endsWith('”')) ||
              (translationText.startsWith('\'') && translationText.endsWith('\''))
            ) {
              translationText = translationText.slice(1, -1).trim();
            }
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Model ${modelName} failed, attempting fallback...`, modelErr?.message || modelErr);
          lastError = modelErr;
        }
      }

      if (!translationText && lastError) {
        throw lastError;
      }

      res.json({ translation: translationText });
    } catch (error: any) {
      console.error("Translation error:", error);
      let errMsg = "Failed to translate text";
      if (error.message) {
         try {
            const parsed = JSON.parse(error.message);
            if (parsed.error && parsed.error.message) {
               errMsg = parsed.error.message;
            } else {
               errMsg = error.message;
            }
         } catch {
            errMsg = error.message;
         }
      }
      res.status(500).json({ error: errMsg });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
