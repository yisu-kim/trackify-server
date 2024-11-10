import { Router } from "express";
import { body } from "express-validator";

import { checkCsrf, isAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { getCsrfToken, getUser } from "../controller/auth.js";
import { initiate, handleCallback } from "../controller/notionAuth.js";
import {
  handleSignIn,
  handleSignUp,
  handleVerificationToken,
} from "../controller/verificationTokenAuth.js";

const router = Router();

const validateSignIn = [
  body("email").trim().isEmail().normalizeEmail().withMessage("invalid email"),
  validate,
];

const validateSignUp = [
  ...validateSignIn,
  body("name").trim().notEmpty().escape().withMessage("name is missing"),
  validate,
];

router.get("/csrf", getCsrfToken);
router.get("/me", isAuthenticated, getUser);

router.get("/notion", initiate);
router.get("/notion/callback", handleCallback);

// WARN: For unsafe methods (POST, PUT, DELETE), ensure to include the checkCsrf middleware.

router.post("/signup", validateSignUp, checkCsrf, handleSignUp);
router.post("/signin", validateSignIn, checkCsrf, handleSignIn);
router.get("/verify", handleVerificationToken);

export default router;
