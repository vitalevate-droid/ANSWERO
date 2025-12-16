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

const FILE = "./businesses.json";

let businesses = JSON.parse(fs.readFileSync(FILE, "utf-8"));

function saveBusinesses() {
  fs.writeFileSync(FILE, JSON.stringify(businesses, null, 2));
}

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-secret"] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================= AI ================= */

app.post("/api/ask", async (req, res) => {
  const { businessId, question } = req.body;
  const b = businesses[businessId];
  if (!b) return res.json({ error: "Business not found" });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Answer ONLY using the business info. If unsure reply FALLBACK_REQUIRED."
      },
      {
        role: "user",
        content: `BUSINESS INFO:\n${b.info}\n\nQUESTION:\n${question}`
      }
    ]
  });

  const text = completion.choices[0].message.content.trim();
  if (text === "FALLBACK_REQUIRED") return res.json({ fallback: true });

  res.json({ answer: text });
});

/* ================= FALLBACK ================= */

app.post("/api/fallback", async (req, res) => {
  const { businessId, email, question } = req.body;
  const b = businesses[businessId];

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    to: b.email,
    from: process.env.EMAIL_USER,
    subject: "New customer question",
    text: `Email: ${email}\n\nQuestion:\n${question}`
  });

  res.json({ success: true });
});

/* ================= ADMIN ================= */

app.get("/admin/list-businesses", requireAdmin, (req, res) => {
  res.json(businesses);
});

app.post("/admin/add-business", requireAdmin, (req, res) => {
  const { id, name, email, info } = req.body;
  businesses[id] = { name, email, info };
  saveBusinesses();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ANSWERO backend running");
});
