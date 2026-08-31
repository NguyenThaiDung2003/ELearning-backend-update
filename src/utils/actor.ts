import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { Actor } from "../services/access.service";
import { unauthorized } from "./errors";

/** Chi dung sau authMiddleware. */
export const getActor = (req: AuthenticatedRequest): Actor => {
  if (!req.user) {
    throw unauthorized();
  }

  return req.user;
};
