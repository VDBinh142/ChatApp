import { Router } from "express";
import * as authController from "./controllers/authContoroller";
import * as friendController from "./controllers/friendController";
import * as imageController from "./controllers/imageController";
import * as profileController from "./controllers/profileController";
import {
  changePasswordForm,
  changeUsernameForm,
  loginForm,
  registerForm,
  respondFriendRequestForm,
  sendFriendRequestForm,
  updateProfileForm,
} from "./forms";
import { verifyToken } from "./middlewares/auth";
import { imageUpload } from "./utils/imageStorage";
import { validate } from "./middlewares/validate";

/**
 * Every HTTP route in the app lives here, in one place, instead of being
 * scattered across multiple route files. Public routes (no auth) are
 * registered first, then everything below requireAuth needs a valid JWT.
 */
const apiRoutes = (): Router => {
  const router = Router();

  // ---- Public routes ----
  router.post("/auth/register", validate(registerForm), authController.register);
  router.post("/auth/login", validate(loginForm), authController.login);

  // ---- Everything below requires authentication ----
  router.use(verifyToken);

  router.post("/auth/logout", authController.logout);

  // Profile
  router.get("/profile", profileController.getProfile);
  router.put("/profile", validate(updateProfileForm), profileController.updateProfile);
  router.put("/profile/avatar", profileController.setAvatar);
  router.put("/groups/:groupId/icon", profileController.setGroupIcon);
  router.put(
    "/profile/username",
    validate(changeUsernameForm),
    profileController.changeUsername
  );
  router.put(
    "/profile/password",
    validate(changePasswordForm),
    profileController.changePassword
  );

  // Friends
  router.post(
    "/friends/requests",
    validate(sendFriendRequestForm),
    friendController.sendFriendRequest
  );
  router.get("/friends/requests", friendController.listFriendRequests);
  router.put(
    "/friends/requests/:id",
    validate(respondFriendRequestForm),
    friendController.respondFriendRequest
  );
  router.get("/friends", friendController.listFriends);
  router.delete("/friends/:username", friendController.deleteFriend);

  // Images (avatars, group icons)
  router.post("/images", imageUpload.single("image"), imageController.uploadImage);
  router.get("/images/:imageName/:variant", imageController.getImage);

  return router;
};

export default apiRoutes;
