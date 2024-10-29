import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { getCsrfToken, getUser } from "../controller/auth.js";
import { initiate, handleCallback } from "../controller/notionAuth.js";

const router = Router();

router.get("/csrf", getCsrfToken);
router.get("/me", isAuthenticated, getUser);

router.get("/notion", initiate);
router.get("/notion/callback", handleCallback);

// WARN: For unsafe methods (POST, PUT, DELETE), ensure to include the checkCsrf middleware.

export default router;
