import { Router } from "express";
import { checkCsrf, isAuthenticated } from "../middleware/auth.js";
import { getCsrfToken, getUser } from "../controller/auth.js";
import { initiate, handleCallback } from "../controller/notionAuth.js";
import {
  handleSignIn,
  handleSignUp,
  handleVerificationToken,
} from "../controller/verificationTokenAuth.js";

const router = Router();

router.get("/csrf", getCsrfToken);
router.get("/me", isAuthenticated, getUser);

router.get("/notion", initiate);
router.get("/notion/callback", handleCallback);

// WARN: For unsafe methods (POST, PUT, DELETE), ensure to include the checkCsrf middleware.

router.post("/signup", checkCsrf, handleSignUp);
router.post("/signin", checkCsrf, handleSignIn);
router.get("/verify", handleVerificationToken);

export default router;
