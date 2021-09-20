const jwt = require("jsonwebtoken");

function generateAccessToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      {expiresIn: "20m"},
      (err, token) => {
        if(err) return reject(err);

        resolve(token);
      }
    );
  });
}

function generateRefreshToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      {expiresIn: "7d"},
      (err, token) => {
        if(err) return reject(err);

        resolve(token);
      }
    )
  });
}

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token, 
      process.env.ACCESS_TOKEN_SECRET, 
      (err, decoded) => {
        if(err) reject(err);

        resolve(decoded);
      }
    );
  });
}

function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token, 
      process.env.REFRESH_TOKEN_SECRET, 
      (err, decoded) => {
        if(err) reject(err);

        resolve(decoded);
      }
    );
  });
}

module.exports = {
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken
};