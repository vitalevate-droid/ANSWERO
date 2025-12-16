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
app.use(express.static("public"));

/* ===============================
   DATA STORAGE
=============================== */
const FILE = "./businesses.json";

let businesses = {};
if (fs.existsSync(FILE)) {
  businesses = JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function saveBusinesses() {
  fs.writeFileSync(FILE, JSON.stringify(businesses, null, 2));
}

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
    const business = businesses[businessId];

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
- Write in full, professional sentences.
- Separate multiple facts using line breaks.
          `
        },
        {
          role: "user",
          content: \`BUSINESS INFORMATION:\n\${business.info}\n\nQUESTION:\n\${question}\`
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
    const business = businesses[businessId];
    if (!business) return res.json({ success: false });

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
      text: `Customer email:\n${email}\n\nQuestion:\n${question}`
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
app.get("/admin/list-businesses", requireAdmin, (req, res) => {
  res.json(businesses);
});

app.post("/admin/add-business", requireAdmin, (req, res) => {
  const { id, name, email, info } = req.body;

  businesses[id] = {
    name: name || id,
    email,
    info
  };

  saveBusinesses();
  res.json({ success: true });
});

/* 🔴 DELETE BUSINESS (NEW) */
app.post("/admin/delete-business", requireAdmin, (req, res) => {
  const { id } = req.body;

  if (!businesses[id]) {
    return res.json({ success: false });
  }

  delete businesses[id];
  saveBusinesses();

  res.json({ success: true });
});

/* ===============================
   START SERVER
=============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ANSWERO backend running on port", PORT);
});
