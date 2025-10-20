import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/api/edit", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const prompt = message;

    if (Array.isArray(history) && history.length) {
      const chat = await model.startChat({ history: history.slice(-20) });
      const result = await chat.sendMessage(prompt);
      const text = result.response.text().trim();
      return res.json({ reply: text });
    } else {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      return res.json({ reply: text });
    }
  } catch (err) {
    return res.status(500).json({ error: "internal_error", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
