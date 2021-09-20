const Router = require("express").Router;
const GamesController = require("../api/games_controller");
const AuthController = require("../api/auth_controller");

const router = new Router();

router.get("/", GamesController.apiGetGames);
router.post("/", GamesController.apiCreateGame); 

router.post("/igdb/companies", GamesController.apiGetGameCompanies);
router.get("/igdb/item/:id", GamesController.apiGetIgdbGameById);
router.post("/igdb/item/:id/stores", GamesController.apiGetGameStores);

router.get("/search", GamesController.apiSearchGames);
router.get("/searchrecs", GamesController.apiGetSearchRecommendations);
router.get("/retailers", GamesController.apiSearchRetailers);

router.get("/offers/steam", GamesController.apiGetSteamOffers);
router.get("/offers/humble-bundle", GamesController.apiGetHumbleOffers);
router.get("/offers/gog", GamesController.apiGetGogOffers);

router.get("/wishlist", GamesController.apiGetWishlistedGames);
router.post("/wishlist", [
  AuthController.authorizeToken,
  GamesController.apiAddToWishlist
]);

module.exports = router;

