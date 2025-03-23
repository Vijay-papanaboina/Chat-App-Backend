const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const upload = multer();
const { supabase } = require("./supabase.js");
require("dotenv").config();

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

pool.on("error", (err) => {
  console.error("Unexpected Pool error:");
});

// Store connected users
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("registerUser", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log("Online Users:", Object.keys(connectedUsers).length);

    // Send updated online users list to all clients
    io.emit("onlineUsers", Object.keys(connectedUsers));
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

  socket.on("markAsRead", async ({ chat_id, user_id }) => {
    try {
      await pool.query(
        `UPDATE messages SET message_read = true 
        WHERE sender = $1 AND receiver = $2 AND message_read = false`,
        [chat_id, user_id]
      );

      // Notify the sender that messages are read
      const senderSocketId = connectedUsers[chat_id];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { chat_id, user_id });
      }

      console.log(`Messages marked as read for chat: ${chat_id}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];

        console.log("User disconnected:", socket.id);
        console.log("Registered Users:", Object.keys(connectedUsers).length);

        io.emit("onlineUsers", Object.keys(connectedUsers));

        break;
      }
    }
  });
});



app.get("/health", async(req, res) => {
  res.status(200).json({success:true})
});




async function updateUserProfile(userId, name, imageUrl) {
  try {
    await pool.query(
      "UPDATE profiles SET app_name = $1, profile_pic = $2 WHERE id = $3",
      [name, imageUrl, userId]
    );
  } catch (error) {
    console.error("Database Error: Failed to update profile.");
    throw new Error("Database update failed");
  }
}

app.post("/upload-profile", upload.single("file"), async (req, res) => {
  try {
    // Validate request body
    const { userId, name } = req.body;
    if (!userId || !name || !req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const fileExtension = req.file.originalname.split(".").pop(); // Extract extension
    const fileName = `${userId}.${fileExtension}`; // e.g., "38c59c1b-7764-43bd-8ba4-052e44dca501.jpg"

    // Upload file to Supabase storage bucket
    const { data, error } = await supabase.storage
      .from("chat-app")
      .upload(`users/profile_pics/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to upload profile picture" });
    }

    let publicURL = `https://phkzagefjrpswkdxvegp.supabase.co/storage/v1/object/public/chat-app/users/profile_pics/${fileName}`;

    // Update user profile
    await updateUserProfile(userId, name, publicURL);

    res.json({ success: true, imageUrl: publicURL });
  } catch (error) {
    console.error("Unexpected Error in /upload-profile:", error.stack);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});



app.get("/get-chat-user", async( req, res) => {
  try{
    const chatUserId=req.query.UserId

     results = await pool.query(
       `SELECT id, full_name, app_name,app_name_temp, profile_pic
       FROM profiles
       WHERE id = $1`,
       [chatUserId]
     );
    console.log("chatUser: ", results.rows)
      res.status(200).json(results.rows[0])
  } catch (err) { 
    console.log("Error getting chat user: ", err)
    res.status(500).json({ success: false, error: "Internal Server Error" });
   }
});




app.get("/searchquery", async (req, res) => {
  const searchQuery = req.query.q;
  const searchParam = `%${searchQuery}%`;
  try {
    if (!searchQuery) {
      return res.status(400).send("Missing search query parameter.");
    }

    const results = await pool.query(
      `SELECT id, full_name, app_name,app_name_temp, profile_pic
         FROM profiles
         WHERE app_name ILIKE $1 OR app_name_temp LIKE $1`,
      [searchParam]
    );

    console.log("search: ", results.rows);
    res.status(200).json(results.rows);
  } catch (err) {
    console.log("search error: ", err);
    return res.status(400).send("Something went wrong during querying.");
  }
});

app.get("/currentUser", async (req, res) => {
  try {
    const userId = req.query.userId?.trim().replace(/^"|"$/g, ""); // Trim spaces & remove extra quotes
    const result = await pool.query(
      "SELECT id, full_name, app_name,app_name_temp, profile_pic FROM profiles WHERE id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/interacted-users", async (req, res) => {
  const currentUserId = req.query.currentUserId;
  if (!currentUserId) {
    return res.status(400).json({ error: "Missing currentUserId" });
  }
  try {
    const results = await pool.query(
      `SELECT DISTINCT u.id, u.full_name, u.app_name, u.app_name_temp, u.profile_pic,
         (SELECT COUNT(*) FROM messages m 
           WHERE m.sender = u.id AND m.receiver = $1 AND m.message_read = false) as unread_count
       FROM profiles u
       JOIN messages m ON (m.sender = u.id OR m.receiver = u.id)
       WHERE (m.sender = $1 OR m.receiver = $1) AND u.id <> $1
       GROUP BY u.id, u.full_name, u.app_name, u.app_name_temp, u.profile_pic`,
      [currentUserId]
    );
    res.status(200).json(results.rows);
  } catch (err) {
    console.error("Error fetching interacted users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




app.get("/get-unread-messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT sender, COUNT(*) AS unread_count
            FROM messages
            WHERE receiver = $1 AND message_read = FALSE
            GROUP BY sender;`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching unread messages:", err);
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
  console.log("Server is running on port 3000");
});
