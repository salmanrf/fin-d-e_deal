function flattenItemStores(stores) {
  const {gog, steam, epicgames} = stores;
  let flattened = {};

  if(gog) {
    flattened = Object.assign(flattened, {
      "gog:url": gog.url,
      "gog:prices:discount": (gog.prices || {discount: "0"}).discount,
      "gog:prices:fullPrice": (gog.prices || {fullPrice: "0"}).fullPrice,
      "gog:prices:currentPrice": (gog.prices || {currentPrice: "0"}).currentPrice,
    });
  }

  if(steam) {
    flattened = Object.assign(flattened, {
      "steam:url": steam.url,
      "steam:prices:discount": (steam.prices || {discount: "0"}).discount,
      "steam:prices:fullPrice": (steam.prices || {fullPrice: "0"}).fullPrice,
      "steam:prices:currentPrice": (steam.prices || {currentPrice: "0"}).currentPrice,
    });
  }

  if(epicgames) {
    flattened = Object.assign(flattened, {
      "epicgames:url": epicgames.url,
      "epicgames:prices:discount": (epicgames.prices || {discount: "0"}).discount,
      "epicgames:prices:fullPrice": (epicgames.prices || {fullPrice: "0"}).fullPrice,
      "epicgames:prices:currentPrice": (epicgames.prices || {currentPrice: "0"}).currentPrice,
    });
  }

  return flattened;
}

function unflattenItemStores(flattened) {
  let unflattened = {};

  if(flattened["gog:url"]) {
    unflattened = Object.assign(unflattened, {
      gog: {
        url: flattened["gog:url"],
        prices: {
          discount: flattened["gog:prices:discount"] || "0",
          fullPrice: flattened["gog:prices:fullPrice"] || "0",
          currentPrice: flattened["gog:prices:currentPrice"] || "0",
        }
      }
    });
  }

  if(flattened["steam:url"]) {
    unflattened = Object.assign(unflattened, {
      steam: {
        url: flattened["steam:url"],
        prices: {
          discount: flattened["steam:prices:discount"] || "0",
          fullPrice: flattened["steam:prices:fullPrice"] || "0",
          currentPrice: flattened["steam:prices:currentPrice"] || "0",
        }
      }
    });
  }

  if(flattened["epicgames:url"]) {
    unflattened = Object.assign(unflattened, {
      epicgames: {
        url: flattened["epicgames:url"],
        prices: {
          discount: flattened["epicgames:prices:discount"] || "0",
          fullPrice: flattened["epicgames:prices:fullPrice"] || "0",
          currentPrice: flattened["epicgames:prices:currentPrice"] || "0",
        }
      }
    });
  }

  return unflattened;
}

function flattenOffersItem(gameObj) {
  let {id, url, title, cover_image, prices, genres, platforms} = gameObj;
  
  genres = genres instanceof Array ? genres.reduce((prev, curr, index) => (
    {
      ...prev,
      [`genres:${index}`]: curr
    }
  ), {}) : genres;

  platforms = platforms instanceof Array ? platforms.reduce((prev, curr, index) => (
    {
      ...prev,
      [`platforms:${index}`]: curr
    }
  ), {}) : platforms;

  const flattened = {
    id, url, title, cover_image,
    ...genres,
    ...platforms,
    "prices.discount": prices.discount,
    "prices.fullPrice": prices.fullPrice,
    "prices.currentPrice": prices.currentPrice
  };

  return flattened;
}

function unflattenOffersItem(gameObj) {
  const {id, url, title, cover_image} = gameObj;
  const genres = [];
  const platforms = [];
  const prices = {
    discount: gameObj["prices.discount"],
    fullPrice: gameObj["prices.fullPrice"],
    currentPrice: gameObj["prices.currentPrice"]
  }
  
  let index = 0;

  while(gameObj[`genres:${index}`]) {
    genres.push(gameObj[`genres:${index}`]);
    index++;
  }

  index = 0;

  while(gameObj[`platforms:${index}`]) {
    platforms.push(gameObj[`platforms:${index}`]);
    index++;
  }

  const unflattened = {id, url, title, cover_image, genres, prices, platforms};

  return unflattened;
}

module.exports = {
  flattenItemStores, 
  unflattenItemStores,
  flattenOffersItem,
  unflattenOffersItem
};