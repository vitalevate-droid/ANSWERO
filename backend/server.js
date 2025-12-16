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
   LOAD & SAVE BUSINESS DATA
================================ */

const BUSINESS_FILE = "./businesses.json";

let businesses = JSON.parse(
  fs.readFileSync(BUSINESS_FILE, "utf-8")
);

function saveBusinesses(data) {
  fs.writeFileSync(
    BUSINESS_FILE,
    JSON.stringify(data, null, 2)
  );
}

/* ===============================
   ADMIN AUTH
================================ */

function requireAdmin(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/* ===============================
   OPENAI CONFIG
================================ */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===============================
   AI QUESTION ENDPOINT
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
- Answer ONLY using the business information
- You MAY logically infer simple facts (e.g. closed days)
- If the answer is NOT clearly supported, respond EXACTLY:
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

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI error" });
  }
});

/* ===============================
   EMAIL FALLBACK ENDPOINT
================================ */

app.post("/api/fallback", async (req, res) => {
  const { businessId, email, question } = req.body;

  const business = businesses[businessId];
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"ANSWERO" <${process.env.EMAIL_USER}>`,
      to: business.email,
      subject: "New customer question",
      text: `Customer email: ${email}\n\nQuestion:\n${question}`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({ error: "Email failed" });
  }
});

/* ===============================
   ADMIN: ADD BUSINESS
================================ */

app.post("/admin/add-business", requireAdmin, (req, res) => {
  const { id, name, email, info } = req.body;

  if (!id || !name || !email || !info) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (businesses[id]) {
    return res.status(400).json({ error: "Business already exists" });
  }

  businesses[id] = { name, email, info };
  saveBusinesses(businesses);

  res.json({ success: true });
});

/* ===============================
   ADMIN: UPDATE BUSINESS
================================ */

app.post("/admin/update-business", requireAdmin, (req, res) => {
  const { id, name, email, info } = req.body;

  if (!businesses[id]) {
    return res.status(404).json({ error: "Business not found" });
  }

  businesses[id] = { name, email, info };
  saveBusinesses(businesses);

  res.json({ success: true });
});

/* ===============================
   START SERVER
================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ANSWERO backend running on port ${PORT}`);
});
