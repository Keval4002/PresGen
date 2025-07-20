import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "./db/pool.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Import routes
import projectsRouter from "./routes/projects.js";
import aiRouter from "./routes/ai.js";
import pptRoutes from "./routes/pptRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import themesRoutes from "./routes/themes.js";

// Mount routes
app.use("/api/projects", projectsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/ppt", pptRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/themes", themesRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("PresGen Server is running.");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 