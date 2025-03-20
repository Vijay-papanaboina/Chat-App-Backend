const express = require('express');
const cors = require('cors');
const {Pool} = require('pg');
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();

const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: { origin: "*" },
});


app.use(express.json());
app.use(cors());


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT, // Default PostgreSQL port
});




// Store connected users
const connectedUsers = {};



io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("registerUser", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log("Registered Users:", connectedUsers);
  });

  socket.on("sendMessage", async (data) => {
    const { sender, receiver, message_text } = data;

    try {
      const result = await pool.query(
        "INSERT INTO messages (sender, receiver, message_text) VALUES ($1, $2, $3) RETURNING *",
        [sender, receiver, message_text]
      );

      const message = result.rows[0];

      // Send message to the receiver if they are online
      if (connectedUsers[receiver]) {
        io.to(connectedUsers[receiver]).emit("newMessage", message);
      }

      // Send message to sender as well
      io.to(socket.id).emit("newMessage", message);
      console.log("newMessage", message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});



app.get("/currentUser", async (req, res) => {
  try {
    const userId = req.query.userId?.trim().replace(/^"|"$/g, ""); // Trim spaces & remove extra quotes
    const result = await pool.query(
      "SELECT id, full_name, app_name, profile_pic FROM profiles WHERE id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.get("/users", async (req, res) => {
  try {
    const excludeId = req.query.excludeId?.trim().replace(/^"|"$/g, ""); // Trim spaces & remove extra quotes
    const result = await pool.query(
      "SELECT id, full_name, app_name, profile_pic FROM profiles WHERE id != $1",
      [excludeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Fetch messages between two users
app.get("/messages", async (req, res) => {
  const { chatWith, currentUser } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE (sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1) ORDER BY created_at",
      [chatWith, currentUser]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


server.listen(3000, () => {
  console.log("Server is running on port 3000");})





