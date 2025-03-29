// routes/profileRoutes.js
const express = require("express");
const multer = require("multer");
const upload = multer();
const { supabase } = require("../supabase");

module.exports = (pool) => {
  const router = express.Router();

  // Helper: Update user profile in the database
  async function updateUserProfile(userId, name, imageUrl) {
    try {
      await pool.query(
        "UPDATE profiles SET app_name = $1, profile_pic = $2 WHERE id = $3",
        [name, imageUrl, userId]
      );
    } catch (error) {
      console.error("Database Error: Failed to update profile.", error);
      throw new Error("Database update failed");
    }
  }

  // Upload profile picture endpoint
  router.post("/upload-profile", upload.single("file"), async (req, res) => {
    try {
      const { userId, name } = req.body;
      if (!userId || !name || !req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Missing required fields" });
      }

      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${userId}.${fileExtension}`;

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

      // Construct public URL (adjust your URL as needed)
      const publicURL = `https://phkzagefjrpswkdxvegp.supabase.co/storage/v1/object/public/chat-app/users/profile_pics/${fileName}`;

      // Update user profile in the database
      await updateUserProfile(userId, name, publicURL);

      res.json({ success: true, imageUrl: publicURL });
    } catch (error) {
      console.error("Unexpected Error in /upload-profile:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  return router;
};
