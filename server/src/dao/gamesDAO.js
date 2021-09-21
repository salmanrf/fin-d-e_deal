const mongodb = require("mongodb");
const fetch = require("node-fetch");
const {wrapTryCatch} = require("../utils/promise_utils");
const IgdbDAO = require("./igdbDAO");
const {
  scrapeSteamOffers,
  scrapeSteamGamePage,
  scrapeGogGamePage,
  scrapeEpicGamePage,
  formatHumbleOffers,
  formatGogOffers,
} = require("../utils/scrape_utils");

const {
  flattenItemStores, 
  unflattenItemStores,
  flattenOffersItem,
  unflattenOffersItem
} = require("../utils/object_utils");
class GamesDAO {
  static db = null;
  static Games = null;
  static Users = null
  static redis = null;
  
  static async injectDB(client) {
    this.db = await client.db("finedeal");
    this.Games = await this.db.collection("games");
    this.Users = await this.db.collection("users");
  }

  static async injectCache(redis) {
    this.redis = redis;
  }

  static async insertGame(gameObj) {
    const {title, genres, developer, publisher} = gameObj;

    const result = await this.Games.insertOne({title, genres, developer, publisher});
    const cursor = await this.Games.findOne({_id: result.insertedId});

    return cursor;
  }

  static async getGames() {
    const cursor = await this.Games.find({});
    const games = await cursor.toArray();
    
    cursor.close();
    
    return games;
  }

  static async getGameById(gameId, projection = {}) {
    const res = await this.Games.findOne({_id: gameId}, {projection});

    return res;
  }

  static async getGameStores(reqBody) {
    const {id} = reqBody;
    let {websites} = reqBody;

    const cached = await this.redis.hgetall(`igdb:${id}:stores`);

    if(cached["steam:url"] || cached["gog:url"] || cached["epicgames:url"]) {
      const stores = unflattenItemStores(cached);

      return stores;
    }
    
    if(id && !(websites instanceof Array)) {
      const game = await IgdbDAO.getGameById(id);

      websites = game.websites instanceof Array ? game.websites : [game.websites];      
    }
    
    let storeSites = {};

    const steamIndex = websites.findIndex(({category}) => category + "" === "13");
    const gogIndex = websites.findIndex(({category}) => category + "" === "17"); 
    const epicgamesIndex = websites.findIndex(({category}) => category + "" === "16");

    if(websites[steamIndex]) Object.assign(storeSites, {steam: websites[steamIndex]});
    if(websites[gogIndex]) Object.assign(storeSites, {gog: websites[gogIndex]});
    if(websites[epicgamesIndex]) Object.assign(storeSites, {epicgames: websites[epicgamesIndex]});
    
    const stores = await this.getGameFromRetailers(storeSites);

    this.redis.hmset(`igdb:${id}:stores`, flattenItemStores(stores))
      .then(() => this.redis.expire(`igdb:${id}:stores`, 60 * 60 * 24));

    return stores;
  }

  static getGameFromRetailers(urlObj) {
    const steamUrl = urlObj.steam && urlObj.steam.url;
    const epicgamesUrl = urlObj.epicgames && urlObj.epicgames.url;
    const gogUrl = urlObj.gog && urlObj.gog.url;

    // Fetch game from multiple stores
    return new Promise((resolve, reject) => {
      Promise.all([
        steamUrl && wrapTryCatch(
          fetch(`${steamUrl}?cc=US`, {
            headers: {
              "cookie": "birthtime=912445201"
            }
          }
        )),
        epicgamesUrl && wrapTryCatch(
          fetch(epicgamesUrl, {
            headers: {
              "cookie": "EPIC_COUNTRY=US;HAS_ACCEPTED_AGE_GATE_ONCE=true"
            }
          }
        )),
        gogUrl && wrapTryCatch(fetch(gogUrl)),
      ])
      .then(([steam, epicgames, gog]) => (
        Promise.all([
          (steam && steam[0]) && wrapTryCatch(steam[0].text()),
          (epicgames && epicgames[0]) && wrapTryCatch(epicgames[0].text()),
          (gog && gog[0]) && wrapTryCatch(gog[0].text())
        ])
      ))
      .then(([steam, epicgames, gog]) => {
        const gogProduct = (gog && gog[0]) && scrapeGogGamePage(gog[0]);
        const steamProduct = (steam && steam[0]) &&  scrapeSteamGamePage(steam[0]);
        const epicgamesProduct = (epicgames && epicgames[0]) && scrapeEpicGamePage(epicgames[0]);
        
        let stores = {};

        if(gogProduct) {
          stores = Object.assign(stores, {gog: {url: gogUrl, ...gogProduct}});
        }

        if(steamProduct) {
          stores = Object.assign(stores, {steam: {url: steamUrl, ...steamProduct}});
        }

        if(epicgamesProduct) {
          stores = Object.assign(stores, {epicgames: {url: epicgamesUrl, ...epicgamesProduct}});
        }
        
        resolve(stores);
      })
      .catch((err) => reject(err));
    })
  }

  static async addRemoveWishlist(userId, gameId) {
    let game = await this.redis.hgetall(`igdb:${gameId}`);

    if(game.id) {
      game = IgdbDAO.unflattenIgdbGame(game);
    } else {
      game = await IgdbDAO.getGameById(gameId);
    }

    if(!game) throw new Error("Can't find game by this id");

    let {id, name, summary, genres, screenshots, cover, websites, platforms} = game;
    genres = genres instanceof Array ? genres.map((g) => g.name || g) : [];
    cover = cover.url || cover;

    const _id = id + "";

    let {wishlistedBy} = 
      (await this.Games.findOne({_id}, {projection: {wishlistedBy: 1}}))
      ||
      {count: 0, users: []}
    ;

    const userQuery = {_id: new mongodb.ObjectId(userId)};
    const userUpdateAdd = {
      $push: {
        wishlists: {
          _id, name, genres, platforms, cover
        }
      }
    };

    const newGame = {
      _id, name,summary, genres, screenshots, cover, websites, platforms,
      wishlistedBy: {count: 1, users: [userId]}
    }

    if(!wishlistedBy) {
      const res = await Promise.all([
        this.Games.insertOne(newGame),  
        this.Users.updateOne(userQuery, userUpdateAdd),
        this.redis.hset(`igdb:${gameId}`, "wishlist:count", 1)
      ]);

      return res;
    } 
    
    // Add to wishlists
    if(!wishlistedBy.users.includes(userId)) {
      return await this.addWishlist(userId, game);
    }
    
    // Remove from wishlists
    if(wishlistedBy.users.includes(userId)) {
      return await this.removeWishlist(userId, gameId);
    }
  }

  static addWishlist(userId, gameObj) {
    const {id, name, genres, cover, platforms} = gameObj;
    const _id = id + "";
    
    const gameQuery = {_id};
    const userQuery = {_id: new mongodb.ObjectId(userId)};
    
    const gameUpdateAdd = {
      $inc: {"wishlistedBy.count": 1}, 
      $push: {"wishlistedBy.users": userId}
    };

    const userUpdateAdd = {
      $push: {
        wishlists: {
          _id, name, genres, platforms, cover
        }
      }
    };
    
    return Promise.all([
      this.Games.updateOne(gameQuery, gameUpdateAdd),
      this.Users.updateOne(userQuery, userUpdateAdd),
      this.redis.hincrby(`igdb:${id}`, "wishlist:count", 1),
    ]);
  }

  static removeWishlist(userId, gameId) {
    const gameQuery = {_id: gameId + ""};
    const userQuery = {_id: new mongodb.ObjectId(userId)};
    
    const gameUpdateRemove = {
      $inc: {"wishlistedBy.count": -1},
      $pull: {"wishlistedBy.users": userId}
    };

    const userUpdateRemove = {$pull: {wishlists: {_id: gameId}}};

    return Promise.all([
      this.Games.updateOne(gameQuery, gameUpdateRemove),
      this.Users.updateOne(userQuery, userUpdateRemove),
      this.redis.hincrby(`igdb:${gameId}`, "wishlist:count", -1)
    ]);
  }

  static async getWishlistedGames() {
    const cursor = await this.Games
      .find({
        "wishlistedBy.count": {$gt: 0}
      })
      .sort({"wishlistedBy.count": -1})
      .limit(10);

    const games = await cursor.toArray();

    return games;
  }

  static async getSteamOffers(page = 0, count = 15, imageRes) {
    const start = page === 0 ? 1 : count * page;

    const steamIds = await this.redis.smembers(`offers:steam:${page}`);

    if(steamIds.length > 0) {
      const cached = await this.hgetAllHashes(steamIds);
      const games = cached.map((cc) => unflattenOffersItem(cc));

      return games;
    }
    
    let res = await fetch(`https://store.steampowered.com/contenthub/querypaginated/specials/TopSellers/render/?query=&start=${start}&count=15&cc=US&l=english&v=4&tag=`);

    res = await res.json(res);
    const games = scrapeSteamOffers(res["results_html"]);

    this.redis.sadd(`offers:steam:${page}`, games.map(({id}) => `steam:${id}`));  
    games.forEach((g) => this.cacheOffersItem("steam", g));

    return games;
  }

  static async getHumbleOffers(requestPage = 1) {
    const page = requestPage - 1;

    const humbleIds = await this.redis.smembers(`offers:humble-bundle:${requestPage}`);

    if(humbleIds.length > 0) {
      const cached = await this.hgetAllHashes(humbleIds);
      const games = cached.map((cc) => unflattenOffersItem(cc));

      return games;
    }

    let res = await fetch(`https://www.humblebundle.com/store/api/search?sort=bestselling&filter=onsale&hmb_source=store_navbar&request=${requestPage + 1}&page=${page}`)

    res = await res.json();
    const games = formatHumbleOffers(res);

    this.redis.sadd(`offers:humble-bundle:${requestPage}`, games.map(({id}) => `humble-bundle:${id}`));
    games.forEach((g) => this.cacheOffersItem("humble-bundle", g));

    return games;
  }

  static async getGogOffers(requestPage = 1) {
    const gogIds = await this.redis.smembers(`offers:gog:${requestPage}`);

    if(gogIds.length > 0) {
      const cached = await this.hgetAllHashes(gogIds);
      const games = cached.map((cc) => unflattenOffersItem(cc));

      return games;
    }

    let res = await fetch(`https://www.gog.com/games/ajax/filtered?mediaType=game&page=${requestPage}&price=discounted&sort=popularity`);
    
    res = await res.json();
    const games = formatGogOffers(res);

    this.redis.sadd(`offers:gog:${requestPage}`, games.map(({id}) => `gog:${id}`));
    games.forEach((g) => this.cacheOffersItem("gog", g));

    return games;
  }

  static hgetAllHashes(keys) {
    return Promise.all(
      keys.map((key) => (
          this.redis.hgetall(key)
      ))
    );
  }

  static async cacheOffersItem(store_name, game) {
    const expiresIn = 60 * 60 * 12;
    const flattened = flattenOffersItem(game);

    await this.redis.hmset(`${store_name}:${flattened.id}`, flattened);
    this.redis.expire(`${store_name}:${flattened.id}`, expiresIn);
  }
}

module.exports = GamesDAO;