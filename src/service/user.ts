import { countUsersById } from "../repository/user.js";

interface UserService {
  isExists(id: number): Promise<boolean>;
}

async function isExists(id: number): Promise<boolean> {
  const count = await countUsersById(id);
  return count > 0;
}

export const userService: UserService = {
  isExists,
};
