// routes/userRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (pool) => {
  // Get current user endpoint
  router.get("/currentUser", async (req, res) => {
    try {
      const userId = req.query.userId?.trim().replace(/^"|"$/g, "");
      const result = await pool.query(
        "SELECT id, full_name, app_name, app_name_temp, profile_pic FROM profiles WHERE id = $1",
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Get interacted users with unread message counts
  router.get("/interacted-users", async (req, res) => {
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
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("/searchquery", async (req, res) => {
    const searchQueryParam = req.query.q;
    const searchParam = `%${searchQueryParam}%`;
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


  return router;
};
