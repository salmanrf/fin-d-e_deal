const {Router} = require("express");
const AuthController = require("../api/auth_controller");
const UsersController = require("../api/user_controller");

const router = new Router();

router.use("/current", AuthController.authorizeToken);

router.get("/current", UsersController.apiGetCurrentUser);

router.get("/current/wishlists", UsersController.apiGetCurrentUserWishlist);

module.exports = router;