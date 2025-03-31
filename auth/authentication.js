import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client (only on the backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Middleware to authenticate requests
export const authentication = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    // Verify token using Supabase Admin API
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Token verification error:", error);
      return res.status(401).json(error.message);
    }

    req.user = data.user; // Store user info in request
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};
