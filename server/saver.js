const fetch = require("node-fetch");
const fs = require("fs/promises");
const path = require("path");
const {wrapTryCatch} = require("./src/utils/promise_utils");

const auth_url = "https://id.twitch.tv/oauth2/token?client_id=9peral5tn2obnpuj42bax4t5zjcan2&client_secret=gjy1tecns4tk3ndws605ijr9roq13o&grant_type=client_credentials";
const clientId = "9peral5tn2obnpuj42bax4t5zjcan2";

(async () => {
  const [res] = await wrapTryCatch(fetch(
    auth_url,
    {method: "POST"}
  ));
  
  const [{access_token}] = await wrapTryCatch(res.json());
  
  let companies = [];
  let cursor = [];
  const limit = 500;
  let lastOffset = 0;
  
  do {
    cursor = await fetch(`https://api.igdb.com/v4/companies`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Client-ID": clientId,
        "Content-Type": "text/plain"
      },
      body: `fields *; limit ${limit}; offset ${lastOffset};`
    });

    lastOffset += 500;

    cursor = await cursor.json();
    companies = companies.concat(cursor);
  
    console.log(companies.length);
    
  } while(cursor.length > 0);

  const stringified = JSON.stringify(companies);
  
  await fs.writeFile(path.join(__dirname, "companies.json"), stringified);
})();