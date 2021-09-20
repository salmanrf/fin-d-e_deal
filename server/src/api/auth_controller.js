const {body, validationResult} = require("express-validator");
const {nanoid} = require("nanoid");
const UsersDAO = require("../dao/usersDAO");
const {wrapTryCatch} = require("../utils/promise_utils");
const {generateHashPassword, comparePasswordWithHash} = require("../utils/password_utils");
const {
  generateAccessToken, 
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} = require("../utils/jwt_utils");

class AuthController {
  static validators = {
    username: 
      body("username")
        .isLength({min: 6, max: 100})
        .withMessage("Must contains 6 to 100 characters")
        .isAlphanumeric()
        .withMessage("Can only contains numbers and alphabets")
        .escape()
        .trim()
      ,
    password:
      body("password")
        .isLength({min: 6, max: 100})
        .withMessage("Must contains 6 to 100 characters")
        .escape()
        .trim()
    ,
    fullName: 
      body("fullName")
        .isAlpha("en-US", {ignore: " "})
        .withMessage("Can only contains Alphabet and spaces (' ')")
        .escape()
        .trim()
  };
  
  static async apiSignup(req, res, next) {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const {username, password, fullName} = req.body;

    const [exists] = await wrapTryCatch(UsersDAO.getUserbyUsername(username, {_id: 1}));

    if(exists) {
      return res
        .status(406)
        .json({
          status: "failed", 
          errors: {
            value: username, 
            msg: "Username already exists", 
            param: "username", 
            location: "body"
          }
        });
    }
    
    const [hash, err] = await wrapTryCatch(generateHashPassword(password));

    if(err) return res.status(500).json({status: "failed", errors: {msg: err.msg}});

    const result = await UsersDAO.insertUser({username, password: hash, fullName});

    res.status(201).json({status: "success", user: result.insertedId});
  }

  static async apiSignin(req, res, next) {
    const tokenId = nanoid(6);
    const errors = validationResult(req);

    if(!errors.isEmpty()) return res.status(400).json({status: "failed", errors: errors.mapped()});
    
    const {username, password} = req.body;

    const userProjection = {"username": 1, "password": 1, "fullName":1, "wishlists._id": 1};
    const [results, err] = await wrapTryCatch(UsersDAO.getCurrentUser({username}, userProjection));

    if(err) {
      return res.status(500).json({status: "failed", errors: {msg: err.message}});
    } 

    if(!results || results.length === 0) {
      return res.status(404).json({status: "failed", errors: {username: {msg: "username not found"}}});
    }

    const [user] = results;
    const [match] = await wrapTryCatch(comparePasswordWithHash(password, user.password));

    if(!match) {
      return res.status(400).json({status: "failed", errors: {password: {msg: "Incorrect password"}}});
    }

    const [act, act_err] = await wrapTryCatch(generateAccessToken({user: {_id: user._id, username: user.username}}));
    const [rft, rft_err] = await wrapTryCatch(generateRefreshToken({tokenId, username: user.username, userid: user._id}));

    if(act_err || rft_err) {
      return res
        .status(500)
        .json({
          status: "failed", 
          errors: {msg: (act_err || rft_err).message}
        });
    };

    res.cookie("refresh_token", rft, {secure: true, sameSite: "none", httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 3})
    res.status(200).json({
      status: "success", 
      token: act, 
      user: {...user, password: ""}
    });

    return UsersDAO.cacheRefreshToken(user.username, tokenId);
  }

  static async apiSignout(req, res, next) {
    if(!req.user)
      return res.status(401).json({status: "failed"});
    
    const {username} = req.user;

    const refresh_token = req.cookies["refresh_token"];
    const [decoded, err] = await wrapTryCatch(verifyRefreshToken(refresh_token));
 
    if(err) {
      return res.status(401).json({status: "failed"});
    }

    const {tokenId} = decoded;

    const [, redis_err] = await wrapTryCatch(UsersDAO.removeRefreshToken(username, tokenId));
    
    if(redis_err) return res.status(401).json({status: "failed"});
    
    return res.status(200).json({status: "success"});
  }

  static async authorizeToken(req, res, next) {
    const authorization = req.headers["authorization"];

    if(!authorization) {
      return res.sendStatus(401);
    }

    const token = (authorization + "").split(" ")[1];

    const [decoded, error] = await wrapTryCatch(verifyAccessToken(token));

    if(error) return res.status(401).json({error});

    req.user = decoded && decoded.user;

    next();
  }

  static async getRefreshToken(req, res, next) {
    const refreshToken = req.cookies["refresh_token"];

    if(!refreshToken) return res.sendStatus(401);

    const [decoded, errors] = await wrapTryCatch(verifyRefreshToken(refreshToken));

    if(errors) return res.status(406).json({status: "failed", errors});

    const {username, userid, tokenId} = decoded;
    
    const result = await UsersDAO.getCachedRefreshToken(username, tokenId);

    if(!result) return res.status(406).json({status: "failed", errors: {name: "JsonWebTokenError", message: "Refresh token has expired"}});

    const [new_act, act_err] = await wrapTryCatch(generateAccessToken({user: {_id: userid, username}}));

    if(act_err) return res.status(500).json({errors: act_err});

    res.status(200).json({status: "success", token: new_act});
  }
}

module.exports = AuthController;