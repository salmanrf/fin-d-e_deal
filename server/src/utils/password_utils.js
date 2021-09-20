const bcryptjs = require("bcryptjs");

async function generateHashPassword(password) {
  const salt = await bcryptjs.genSalt(12);
  const hash = await bcryptjs.hash(password, salt);

  return hash;
}

async function comparePasswordWithHash(password, hash) {
  const match = await bcryptjs.compare(password, hash);

  return match;
}

module.exports = {generateHashPassword, comparePasswordWithHash};