// server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Pool } = require("pg");
require("dotenv").config();
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());



// Create HTTP server
const server = http.createServer(app);

// Database Pool (could also be abstracted into a separate file)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

pool.on("error", (err) => {
  console.error("Unexpected Pool error:", err);
});

// Import routes
const chatRoutes = require("./routes/chatRoutes").default(pool);
const profileRoutes = require("./routes/profileRoutes")(pool);
const userRoutes = require("./routes/userRoutes")(pool);

// Mount routes
app.use("/api/chat", chatRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ success: true });
});

// Set up Socket.IO in a separate module
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });
require("./sockets/chatSocket")(io, pool);

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
