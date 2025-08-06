import { Router } from "express";
import { authenticateToken } from "../auth/jwt.service";
import {
  usersController,
  requireAdmin,
} from "./users.controller";

export const usersRouter = Router();

usersRouter.post("/register", (req, res) => usersController.register(req, res));
usersRouter.post("/register-temp", (req, res) =>
  usersController.registerWithTempPassword(req, res)
);
usersRouter.post("/login", (req, res) => usersController.login(req, res));
usersRouter.post("/refresh", (req, res) =>
  usersController.refreshToken(req, res)
);

usersRouter.get("/profile", authenticateToken, (req, res) =>
  usersController.getProfile(req, res)
);
usersRouter.put("/reset-password", authenticateToken, (req, res) =>
  usersController.resetPassword(req, res)
);
usersRouter.get("/:id", authenticateToken, (req, res) =>
  usersController.getUserById(req, res)
);

usersRouter.get("/", authenticateToken, requireAdmin, (req, res) =>
  usersController.getAllUsers(req, res)
);
usersRouter.post("/", authenticateToken, requireAdmin, (req, res) =>
  usersController.createUser(req, res)
);

export default usersRouter;

export const UsersModule = {
  router: usersRouter,
  controller: usersController,
  middlewares: {
    authenticateToken,
    requireAdmin,
  },
};
