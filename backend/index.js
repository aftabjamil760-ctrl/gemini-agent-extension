// index.js
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

dotenv.config();

// ✅ Gemini API Key from .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Corrected Model Name: Using "gemini-2.5-flash" (fast)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
// Note: If you want the more powerful model, use "gemini-2.5-pro" instead.

// ✅ Function: Edit or Generate Code
async function editCode() {
  try {
    // 🔹 یہاں پر آپ اپنی فائل کا راستہ دیں
    const filePath = "./backend/app.js";

    // 🔹 چیک کریں کہ فائل موجود ہے یا نہیں
    if (!fs.existsSync(filePath)) {
      console.log("⚠️ Error: app.js فائل نہیں ملی۔ پہلے یہ فائل بنائیں۔");
      return;
    }

    // 🔹 فائل کا مواد پڑھیں
    const originalCode = fs.readFileSync(filePath, "utf8");

    // 🔹 پرامپٹ — یہاں آپ اپنی ہدایت دیں (code edit یا explain وغیرہ)
    const prompt = `
    یہ کوڈ ایڈیٹ کرو تاکہ یہ بہتر ہو جائے، اور ہر لائن پر اردو میں تبصرہ (comments) بھی لکھ دو:
    ${originalCode}
    `;

    // 🔹 Gemini API کو کال کریں
    const result = await model.generateContent(prompt);
    
    // 🔹 صرف کوڈ حاصل کرنے کے لیے، اضافی ٹیکسٹ ہٹانے کے لیے Trim استعمال کریں
    const newCode = result.response.text().trim(); 

    // 🔹 نیا کوڈ فائل میں لکھیں
    fs.writeFileSync("./app_edited.js", newCode);
    console.log("✅ نیا کوڈ تیار ہو گیا: app_edited.js فائل میں محفوظ ہے۔");
  } catch (err) {
    // ❌ یہاں پر اب آپ کو 404 Not Found والا ایرر نہیں آنا چاہیے۔
    console.error("❌ Error:", err);
  }
}

// فنکشن چلائیں
editCode();