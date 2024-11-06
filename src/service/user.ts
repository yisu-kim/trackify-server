import { countUsersById } from "../repository/user.js";

interface UserService {
  isExists(id: number): Promise<boolean>;
}

async function isExists(id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid user ID");
  }
  try {
    const count = await countUsersById(id);
    return count > 0;
  } catch (error) {
    console.error("User Existence Error:", error);
    throw new Error("Failed to check user existence");
  }
}

export const userService: UserService = {
  isExists,
};
