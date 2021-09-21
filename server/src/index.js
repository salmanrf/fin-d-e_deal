const {MongoClient} = require("mongodb");
const http = require("http");
const Redis = require("ioredis");
const app = require("./app");
const GamesDAO = require("./dao/gamesDAO");
const UsersDAO = require("./dao/usersDAO");
const IgdbDAO = require("./dao/igdbDAO");

const server = http.createServer(app);
const port = process.env.PORT || 8000;

require("dotenv").config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

(async () => {
  try {
    const client = await MongoClient.connect(process.env.DB_URL, {useNewUrlParser: true});

    await IgdbDAO.initIGDB(client, redis);
    await GamesDAO.injectDB(client);
    await UsersDAO.injectDB(client);

    UsersDAO.injectCache(redis);
    GamesDAO.injectCache(redis);

    server.listen(port, () => {
      console.log(`server is listening on port ${port}`);
    });
    
  } catch(err) {
    console.error(err.stack || err.message);
    process.exit(1);
  }
})();