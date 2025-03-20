const express = require('express');
const cors = require('cors');
const {Pool} = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT, // Default PostgreSQL port
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
  console.log(chatWith, currentUser);
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE (sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1) ORDER BY created_at",
      [chatWith, currentUser]
    );
    console.log("users", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Send a message
app.post("/sendMessages", async (req, res) => {
  const { sender, receiver, message_text } = req.body;
  console.log("from send message",sender, receiver, message_text);
  try {
    const result = await pool.query(
      "INSERT INTO messages (sender, receiver, message_text) VALUES ($1, $2, $3) RETURNING *",
      [sender, receiver, message_text]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");})