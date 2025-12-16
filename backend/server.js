import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   LOAD BUSINESS DATA
================================ */
const businesses = JSON.parse(
  fs.readFileSync("./businesses.json", "utf-8")
);

/* ===============================
   OPENAI CONFIG
================================ */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===============================
   ASK AI ENDPOINT
================================ */
app.post("/api/ask", async (req, res) => {
  const { businessId, question } = req.body;

  if (!businessId || !question) {
    return res.status(400).json({ error: "Missing data" });
  }

  const business = businesses[businessId];
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  const systemPrompt = `
You are ANSWERO, an AI assistant for ONE business.

STRICT RULES:
- You may ONLY answer using the business information provided
- You may logically infer simple facts (e.g. if open Mon–Fri, then closed Sat)
- If the answer is NOT clearly supported, respond EXACTLY with:
FALLBACK_REQUIRED
- Do NOT invent services, prices, locations, or hours
`;

  const userPrompt = `
BUSINESS INFORMATION:
${business.info}

QUESTION:
${question}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    });

    const answer = completion.choices[0].message.content.trim();

    if (answer === "FALLBACK_REQUIRED") {
      return res.json({ fallback: true });
    }

    res.json({ answer });

  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "AI processing error" });
  }
});

/* ===============================
   FALLBACK EMAIL ENDPOINT
================================ */
app.post("/api/fallback", async (req, res) => {
  const { businessId, email, question } = req.body;

  const business = businesses[businessId];
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `"ANSWERO" <${process.env.EMAIL_USER}>`,
      to: business.email,
      subject: "New customer question",
      text: `Customer email: ${email}\n\nQuestion:\n${question}`
    });

    res.json({ success: true });

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    res.status(500).json({ error: "Email failed" });
  }
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ANSWERO backend running on port ${PORT}`);
});
