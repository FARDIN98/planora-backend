import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy -- CRITICAL for Render (reverse proxy, HTTPS termination)
app.set("trust proxy", 1);

// CORS configuration -- must come before all route handlers
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

// Better Auth handler -- MUST come BEFORE express.json()
// Better Auth parses its own request bodies; express.json() would consume the stream
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// Body parsing for all OTHER routes (after auth handler)
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

// Start server
app.listen(PORT, () => {
  console.log(`Planora backend running on port ${PORT}`);
});

export default app;
