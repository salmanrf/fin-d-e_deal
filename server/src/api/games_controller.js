const GamesDAO = require("../dao/gamesDAO");
const IgdbDAO = require("../dao/igdbDAO");
const {wrapTryCatch} = require("../utils/promise_utils");

class GamesController {
  static async apiCreateGame(req, res, next) {
    const expectedKeys = ["title", "genres", "developer", "publisher"];

    const {body} = req;
    
    if(expectedKeys.some((key) => !body[key])) {
      return res.status(400).json({status: "failed", error: {message: "Must have all required fields!"}});
    }

    try {
      const game = await GamesDAO.insertGame(body);

      res.status(201).json({status: "success", game});
    } catch(err) {
      res.status(500).json({status: "failed", error: {message: err.message}});
    }
  }

  static async apiGetGames(req, res, next) {
    try {
      const games = await GamesDAO.getGames();

      return res.status(200).json({status: "success", games});
    } catch(err) {
      return res.status(500).json({status: "failed", error: {message: err.message}});
    }
  }

  static async apiGetIgdbGameById(req, res, next) {
    const {id} = req.params;

    // const game = await IgdbDAO.getGameById(id);
    const [results, errors] = await wrapTryCatch(
      Promise.all([
        IgdbDAO.getGameById(id),
        GamesDAO.getGameById(id + "", {"wishlistedBy.count": 1})
      ])
    );
 
    if(errors) {
      return res.status(500).json({status: "failed", errors});
    } 

    const game = results[0] || null;
    const local = results[1] || null ;

    if(!game) {
      return res.sendStatus(404);
    }

    const {wishlistedBy = {count: 0}} = local || {count: 0};

    return res.status(200).json({status: "success", game: {...game, wishlistedBy}});
  }

  static async apiGetSearchRecommendations(req, res, next) {
    const {keyword} = req.query;

    const [recommendations, errors] = await wrapTryCatch(IgdbDAO.getSearchKeywords(keyword));

    if(errors) return res.status(500).json({status: "failed", errors});
    
    return res.status(200).json({status: "success", recommendations});
  }
  
  static async apiSearchGames(req, res, next) {
    const {keyword, page} = req.query;

    const fields = ["id", "name", "cover", "first_release_date", "websites"];

    const [results, errors] = await wrapTryCatch(IgdbDAO.getGamesByTitle(keyword, page));

    if(errors) return res.status(500).json({status: "failed", errors});

    const games = results.map((g) => (
      fields.reduce((prev, curr) => ({...prev, [curr]: g[curr]}), {}) 
    ));

    return res.status(200).json({status: "success", games});
  }

  static async apiGetGameCompanies(req, res, next) {
    const {involved_companies} = req.body;
    
    const ids = involved_companies instanceof Array ? 
      involved_companies.reduce((prev, curr, index) => (
        index < involved_companies.length - 1 ? prev + curr + "," : prev + curr
      ), "")
      :
      involved_companies + "" 
    ;
 
    const limit = involved_companies instanceof Array ? involved_companies.length : 1;
    const query = `fields name; where id = (${ids}); limit ${limit};`;
    const companies = await IgdbDAO.getIgdbCompanies(query);

    return res.status(200).json({status: "success", companies});
  }

  static async apiGetGameStores(req, res, next) {
    const {id} = req.params;
    const {websites} = req.body;

    const [stores, errors] = await wrapTryCatch(GamesDAO.getGameStores({id, websites}));

    if(errors) {
      return res.status(500).json({status: "failed", errors});
    }

    return res.status(200).json({status: "success", stores});
  }
  
  static async apiSearchRetailers(req, res, next) {
    const {keyword} = req.query;

    const [retailers, errors] = await wrapTryCatch(GamesDAO.getGamesFromRetailers(keyword));

    if(errors) return res.status(500).json({status: "failed", errors});

    return res.status(200).json({status: "success", retailers});
  }

  static async apiAddToWishlist(req, res, next) {
    const {user} = req;
    const gameId = req.body;

    const result = await GamesDAO.addRemoveWishlist(user._id, gameId);
    
    return res.status(201).json(result);
  }

  static async apiGetWishlistedGames(req, res, next) {
    const games = await GamesDAO.getWishlistedGames();

    return res.status(200).json({status: "success", games});
  }

  static async apiGetSteamOffers(req, res, next) {
    const {page} = req.query;

    const offers = await GamesDAO.getSteamOffers(parseInt(page) - 1, 15, "hd");

    return res.status(200).json({status: "success", offers});
  }

  static async apiGetHumbleOffers(req, res, next) {
    const {page} = req.query;

    const offers = await GamesDAO.getHumbleOffers(page);

    return res.status(200).json({status: "success", offers});
  }


  static async apiGetGogOffers(req, res, next) {
    const {page} = req.query;

    const offers = await GamesDAO.getGogOffers(page);

    return res.status(200).json({status: "success", offers});
  }
}


module.exports = GamesController;