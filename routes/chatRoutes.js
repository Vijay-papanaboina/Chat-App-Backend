// routes/chatRoutes.js
import { Router } from "express";
const router = Router();

export default (pool) => {
  // Get messages between two users with offset-based pagination
  router.get("/messages", async (req, res) => {
    const { chatWith, currentUser, offset, limit } = req.query;
    const offsetVal = parseInt(offset, 10) || 0;
    const limitVal = parseInt(limit, 10) || 50;
    try {
      console.log(`Loading messages: offset=${offsetVal}, limit=${limitVal}`);
      const query = `
        SELECT * FROM messages
        WHERE (sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4;
      `;
      const values = [chatWith, currentUser, limitVal, offsetVal];
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("more-/messages", async (req, res) => {
    const { chatWith, currentUser, offset = 0, limit = 50 } = req.query;
    try {
      const query = `
      SELECT * FROM messages
      WHERE (sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;
      const values = [chatWith, currentUser, limit, offset];
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Get chat user details endpoint
  router.get("/get-chat-user", async (req, res) => {
    try {
      const chatUserId = req.query.UserId;
      const result = await pool.query(
        `SELECT id, full_name, app_name, app_name_temp, profile_pic
         FROM profiles
         WHERE id = $1`,
        [chatUserId]
      );
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("Error getting chat user:", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  // Get unread messages count endpoint
  router.get("/get-unread-messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await pool.query(
        `SELECT sender, COUNT(*) AS unread_count
         FROM messages
         WHERE receiver = $1 AND message_read = FALSE
         GROUP BY sender`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching unread messages:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
