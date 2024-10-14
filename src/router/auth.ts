import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { getCsrfToken, getUser } from "../controller/auth.js";
import { initiate, handleCallback } from "../controller/notionAuth.js";

const router = Router();

router.get("/notion", initiate);
router.get("/notion/callback", handleCallback);

router.get("/csrf", getCsrfToken);
router.get("/me", isAuthenticated, getUser);

export default router;
