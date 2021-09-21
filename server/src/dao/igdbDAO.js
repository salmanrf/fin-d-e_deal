const fetch = require("node-fetch");
const {wrapTryCatch} = require("../utils/promise_utils");

class IgdbDAO {
  static access_token = null;
  static db = null;
  static Games = null;
  static redis = null;
  
  static authenticateIGDB() {
    return new Promise(async (resolve, reject) => {
      const [res, fetchErr] = await wrapTryCatch(fetch(
        process.env.IGDB_AUTH_URL,
        {method: "POST"}
      ));

      if(fetchErr) return reject(fetchErr);
      if(res.status !== 200) return reject(new Error("Error authenticating to API"));

      const [cred, credErr] = await wrapTryCatch(res.json());

      if(credErr) return reject(credErr);

      if(cred) {
        this.access_token = cred.access_token;
        resolve();
      }
    });
  }

  static initIGDB(dbClient, redisClient) {
    return new Promise(async (resolve, reject) => {
      this.db = await dbClient.db("finedeal");
      this.Games = await this.db.collection("games");
      this.redis = redisClient;
      
      const [, err] = await wrapTryCatch(this.authenticateIGDB());

      if(err) return reject(err);

      setInterval(() => {
        this.authenticateIGDB()
          .then(() => null)
          .catch(() => null);
      }, 1000 * 60 * 60);

      return resolve();
    });    
  }

  static fetchIgdbApi(path = "/games", body) {
    return fetch(
      `https://api.igdb.com/v4${path}`, 
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.access_token}`,
          "Client-ID": process.env.IGDB_CLIENTID,
          "Content-Type": "text/plain"
        },
        body
      }
    )
  }

  static async getSearchKeywords(keyword, count = 5) {
    return new Promise((resolve, reject) => {
      const stream = this.redis.scanStream({match: `igdb:searches:*${keyword}*`, count});
      const searchTerms = [];
  
      stream.on("data", (keys) => {
        if(searchTerms.length === count) {
          stream.destroy();
          resolve(searchTerms);
        }

        searchTerms.push(...keys.map((key) => key.split(":")[2]));
      });
  
      stream.on("end", () => {
        resolve(searchTerms);
      });
    });
  }

  static async getGameById(gameId) { 
    const cached = await this.redis.hgetall(`igdb:${gameId}`);

    if(cached) {
      const game = this.unflattenIgdbGame(cached); 

      if(this.validateGameFields(cached)) {
        return game;
      }
    }
    
    const reqPath = "/games";
    const reqBody = `
      fields name, summary, url, screenshots.url, cover.url, genres.name, 
      websites.url, websites.category, 
      platforms.category, platforms.name, platforms.abbreviation,
      involved_companies.company, involved_companies.publisher, involved_companies.developer, 
      first_release_date;
      where id = ${gameId};
    `;
    
    const [igdbRes, fetchErr] = await wrapTryCatch(this.fetchIgdbApi(reqPath, reqBody));

    if(fetchErr) throw fetchErr;

    const [parseRes, parseErr] = await wrapTryCatch(igdbRes.json());
    const igdbGame = parseRes instanceof Array ? parseRes[0] : parseRes;

    if(parseErr) throw parseErr;

    if(!igdbGame) {
      const error = new Error(`Can't find game by id ${gameId}`);
      error.code = 404;
      throw error;
    }
    
    const game = this.validateGameFields(igdbGame) ? igdbGame : null;
  
    if(game) this.cacheIgdbGame(game);

    return this.unflattenIgdbGame(this.flattenIgdbGame(game));
  }

  static async getGamesByTitle(title, page = 1, count = 10) {
    let res = null, err = null;
    const pageInt = parseInt(page);
    const cacheKey = `igdb:searches:${(title + "").toLowerCase()}:${pageInt}`;
    
    if(pageInt === NaN) {
      const error = new Error("Query 'page' is not a number!");
      throw error;
    }
    
    // Check if this search term is already cached
    [res, err] = await wrapTryCatch(this.redis.smembers(cacheKey));

    // Get all games under this search term from cache
    if(res.length > 0) {
      const keys = res instanceof Array ? res : [res];
      const cached = await this.hgetAllHashes(keys);
      const games = cached.map((cc) => this.unflattenIgdbGame(cc));

      return games;
    }

    // Fetch games from Igdb API
    const reqPath = "/games";
    const reqBody = `
      fields name, summary, url, screenshots.url, cover.url, genres.name, 
      websites.url, websites.category, 
      platforms.category, platforms.name, platforms.abbreviation,
      involved_companies.company, involved_companies.publisher, involved_companies.developer, 
      first_release_date;
      where name ~ *"${title}"* & category = (0,2,3,4,8,9,10) & release_dates.platform = (48,49,6);
      offset ${pageInt > 1 ? (pageInt - 1) * count : 0};
      limit ${count};
      sort total_count desc;
    `;

    [res, err] = await wrapTryCatch(this.fetchIgdbApi(reqPath, reqBody));

    if(err) throw err;

    [res, err] = await wrapTryCatch(res.json());

    if(err) throw err;

    // Ensure the resulting object is an array 
    // Validate game obj to ensure expected fields are present
    const games = res instanceof Array ? 
      res.filter((g) => this.validateGameFields(g))
      : 
      this.validateGameFields(res) ? [res] : []
    ;

    // Cache search result ids 
    if(games.length > 0) {
      this.redis.sadd(cacheKey, games.map(({id}) => `igdb:${id}`));
    }

    // Cache each game in individual Hash keys
    games.forEach((game) => game && this.cacheIgdbGame(game));
    
    // return res;
    return games.map((g) => this.flattenIgdbGame(g)).map((g) => this.unflattenIgdbGame(g));
  }

  static async getIgdbCompanies(body) {
    return new Promise((resolve) => (
      this.fetchIgdbApi(
        "/companies",
        body
      )
      .then((res) => res.json())
      .then((res) => resolve(res))
    ));    
  }

  static hgetAllHashes(keys) {
    return Promise.all(
      keys.map((key) => (
          this.redis.hgetall(key)
      ))
    );
  }

  static async cacheIgdbGame(gameObj) {
    const flattened = this.flattenIgdbGame(gameObj);

    return wrapTryCatch(this.redis.hmset(`igdb:${flattened.id}`, flattened));
  } 

  static validateGameFields(gameObj) {
    if(!gameObj) return false;
    
    const expectedFields = ["id", "cover", "name"]

    if(expectedFields.some((field) => !gameObj[field])) {
      return false;
    }

    return true;
  }

  static flattenIgdbGame(unflattened) {
    let {
      id, cover = {}, name, summary, url, genres, platforms,
      screenshots, websites, involved_companies, first_release_date
    } = unflattened;
    
    genres = genres instanceof Array ? 
      genres.reduce((prev, {name}, index) => (
        {
          ...prev,
          [`genres:${index}`]: name
        }
      ), {}) : {};

    involved_companies = involved_companies instanceof Array ?
        involved_companies.reduce((prev, {company, publisher, developer}, index) => (
          {
            ...prev,
            [`involved_companies:${index}:company`]: `${company}`,
            [`involved_companies:${index}:publisher`]: `${publisher}`,
            [`involved_companies:${index}:developer`]: `${developer}`,
          }
        ) , {}) : {};

    screenshots = screenshots instanceof Array ? screenshots.reduce((prev, {url}, index) => (
      {
        ...prev,
        [`screenshots:${index}`]: url
      }
    ), {}) : {};

    websites = websites instanceof Array ? 
      websites.reduce((prev, {category, url}, index) => (
        {
          ...prev,
          [`websites:${index}:category`]: category,
          [`websites:${index}:url`]: url,
        }
      ), {}) : {};

    platforms = platforms instanceof Array ? 
      platforms.reduce((prev, {category, abbreviation, name}, index) => (
        {
          ...prev,
          [`platforms:${index}:abbreviation`]: abbreviation,
          [`platforms:${index}:category`]: category,
          [`platforms:${index}:name`]: name,
        }
      ), {}) : {};

    const flattened = {
      id, name, summary, url,
      first_release_date,
      cover: cover.url || "",
      ...genres, 
      ...screenshots,
      ...websites, 
      ...platforms,
      ...involved_companies,
    }

    return flattened;    
  }

  static unflattenIgdbGame(flattened = {}) {
    const {id, name, summary, url, cover, first_release_date} = flattened;

    const genres = [];
    const screenshots = [];
    const websites = [];
    const platforms = [];
    const involved_companies = [];

    let i = 0;

    while(flattened[`genres:${i}`]) {
      genres.push(flattened[`genres:${i}`]);
      i++;
    }
    
    i = 0;

    while(flattened[`screenshots:${i}`]) {
      screenshots.push(flattened[`screenshots:${i}`]);
      i++;
    }

    i = 0;

    while(flattened[`websites:${i}:category`] && flattened[`websites:${i}:url`]) {
      websites.push({
        category: flattened[`websites:${i}:category`],
        url: flattened[`websites:${i}:url`]       
      })
      i++;
    }

    i = 0;

    while(flattened[`platforms:${i}:category`] && flattened[`platforms:${i}:name`] && flattened[`platforms:${i}:abbreviation`]) {
      platforms.push({
        category: flattened[`platforms:${i}:category`],
        name: flattened[`platforms:${i}:name`],
        abbreviation: flattened[`platforms:${i}:abbreviation`]    
      });

      i++;
    }

    i = 0;

    while(flattened[`involved_companies:${i}:company`] && flattened[`involved_companies:${i}:developer`] && flattened[`involved_companies:${i}:publisher`]) {
      involved_companies.push({
        company: flattened[`involved_companies:${i}:company`],
        developer: Boolean(flattened[`involved_companies:${i}:developer`]),
        publisher: Boolean(flattened[`involved_companies:${i}:publisher`]),
      });

      i++;
    }

    return {
      id: parseInt(id), name, summary, url, cover, first_release_date,
      genres, screenshots, websites, platforms, involved_companies
    };
  }
}

module.exports = IgdbDAO;