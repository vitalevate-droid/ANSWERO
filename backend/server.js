import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===============================
   DATABASE
=============================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table once
await pool.query(`
  CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    info TEXT
  )
`);

/* ===============================
   ADMIN AUTH
=============================== */
function requireAdmin(req, res, next) {
  if (req.headers["x-admin-secret"] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/* ===============================
   OPENAI
=============================== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===============================
   AI QUESTION ENDPOINT
=============================== */
app.post("/api/ask", async (req, res) => {
  try {
    const { businessId, question } = req.body;

    const result = await pool.query(
      "SELECT * FROM businesses WHERE id = $1",
      [businessId]
    );

    const business = result.rows[0];

    if (!business) {
      return res.json({ fallback: true });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant answering customer questions for a business.

RULES:
- Use ONLY the provided business information.
- If the question cannot be answered with confidence, reply exactly: FALLBACK_REQUIRED.

ANSWER STYLE:
- Write in full, professional sentences.
- Keep answers clear, calm, and business-appropriate.
- When mentioning multiple facts, separate them using line breaks.
- Avoid long paragraphs.
- Do NOT use bullet points, symbols, headings, or formatting.
- Do NOT repeat the question.
          `
        },
        {
          role: "user",
          content: `BUSINESS INFORMATION:\n${business.info}\n\nQUESTION:\n${question}`
        }
      ]
    });

    const answer = completion.choices[0].message.content.trim();

    if (answer.toLowerCase().includes("fallback_required")) {
      return res.json({ fallback: true });
    }

    res.json({ answer });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({ fallback: true });
  }
});

/* ===============================
   EMAIL FALLBACK
=============================== */
app.post("/api/fallback", async (req, res) => {
  try {
    const { businessId, email, question } = req.body;

    const result = await pool.query(
      "SELECT * FROM businesses WHERE id = $1",
      [businessId]
    );

    const business = result.rows[0];

    if (!business) {
      return res.json({ success: false });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("EMAIL SKIPPED: Missing credentials");
      return res.json({ success: true });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: business.email,
      from: process.env.EMAIL_USER,
      subject: "New customer question from ANSWERO",
      text: `
Customer email:
${email}

Question:
${question}
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.json({ success: false });
  }
});

/* ===============================
   ADMIN DASHBOARD
=============================== */
app.get("/admin/list-businesses", requireAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM businesses");
  const data = {};

  result.rows.forEach(b => {
    data[b.id] = {
      name: b.name,
      email: b.email,
      info: b.info
    };
  });

  res.json(data);
});

app.post("/admin/add-business", requireAdmin, async (req, res) => {
  const { id, name, email, info } = req.body;

  await pool.query(
    `
    INSERT INTO businesses (id, name, email, info)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      info = EXCLUDED.info
    `,
    [id, name, email, info]
  );

  res.json({ success: true });
});

/* ===============================
   START SERVER
=============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ANSWERO backend running on port", PORT);
});
