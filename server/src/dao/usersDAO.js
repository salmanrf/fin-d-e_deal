const {ObjectId} = require("mongodb");

class UsersDAO {
  static db = null;
  static Users = null;
  static redis = null;
  
  static async injectDB(client) {
    this.db = await client.db("finedeal");
    this.Users = await this.db.collection("users");
  }

  static async injectCache(client) {
    this.redis = client;
  }
  
  static async insertUser(userObj) {
    const {username, password, fullName} = userObj;

    const result = await this.Users.insertOne(
      {
        username, password, fullName,
        wishlists: []
      });

    return result;
  }

  static async getCurrentUser(match, projection) {
    const matchStage = {
      $match: {
        ...match
      },
    };

    let projectStage = {
      $project: {
        wishlists: 0
      }
    }

    if(projection) {
      projectStage = {$project: {...projection}};
    }

    const limitStage = {$limit: 1};
    
    const pipelines = [
      matchStage,
      limitStage,
      projectStage
    ];

    if(projection["wishlists"] === 1 || projection["wishlists._id"] === 1) {
      pipelines.push({
        $set: {
          wishlistCount: {
            $size: "$wishlists"
          }
        }
      });
    }
    
    const cursor = await this.Users.aggregate(pipelines);
 
    const result = await cursor.toArray();

    return result;
  }

  static async getUserbyUsername(username, projection) {
    const result = await this.Users.findOne({username}, {projection});

    return result;
  }

  static async cacheRefreshToken(username, tokenid) {
    // Create timestamp for sorted-set score
    const timestamp = Date.now();
    // Each user stores rfts in their own sorted-set ex: "syd-refresher-ids"
    const userRefreshersZset = `${username}:refresher-ids`;
    
    // Add new rft to the sorted-set
    await this.redis.zadd(userRefreshersZset, timestamp, tokenid);

    // Get rfts count
    const tokenCount = await this.redis.zcard(userRefreshersZset);

    // Trim the sorted set so each user can't have more than 5 rfts in a given moment
    if(parseInt(tokenCount) > 5) {
      await this.redis.zremrangebyrank(userRefreshersZset, 0, 0);
    }

    return;
  }

  static async removeRefreshToken(username, tokenid) {
    const res = await this.redis.zrem(`${username}:refresher-ids`, tokenid);

    return res;
  }

  static async getCachedRefreshToken(username, tokenid) {
    return await this.redis.zscore(`${username}:refresher-ids`, tokenid);
  }
}

module.exports = UsersDAO;