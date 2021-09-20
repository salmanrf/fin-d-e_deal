const {Router} = require("express");
const AuthController = require("../api/auth_controller");

const router = new Router();

router.post("/signup", [
  AuthController.validators.username,
  AuthController.validators.password,
  AuthController.validators.fullName, 
  AuthController.apiSignup
]);

router.post("/signin", [
  AuthController.validators.username,
  AuthController.validators.password,
  AuthController.apiSignin
]);

router.get("/signout", [
  AuthController.authorizeToken,
  AuthController.apiSignout
])

router.get("/refresh", AuthController.getRefreshToken);

module.exports = router;