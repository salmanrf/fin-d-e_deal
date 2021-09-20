const cheerio = require("cheerio");

function scrapeSteamSearch(htmlString) {
  const $ = cheerio.load(htmlString);

  const searchContainer = $(".search_result_row");
  const url = searchContainer.attr("href");
  const name = searchContainer.find(".search_name").first().text().trim();
  const discount = searchContainer.find(".search_discount").first().text().trim();
  const pricesElem = searchContainer.find(".search_price").first().text().trim();

  const [fullPrice, currentPrice] = pricesElem.match(/\w{1,3}\s\d{1,3}\s\d{1,3}\s*(\d{1,3})*/g);
  
  return {
    url,
    title: name,
    prices: {
      discount: Number.parseInt(discount) || 0,
      fullPrice,
      currentPrice: currentPrice || fullPrice,
    }, 
  };
}

function scrapeSteamOffers(htmlString) {
  const $ = cheerio.load(htmlString);

  const topSellerItems = [];

  $(".tab_item").each((index, elem) => {
    const url = elem.attribs["href"].trim();
    const id = elem.attribs["data-ds-appid"].trim();
    const cover_image = $(elem).find(".tab_item_cap_img").attr("src").trim().replace(/capsule_\S+.jpg/, "capsule_616x353.jpg");
    const title = $(elem).find(".tab_item_name").text().trim();
    const discount = $(elem).find(".discount_pct").text().trim();
    const fullPrice = $(elem).find(".discount_original_price").text().trim();
    const currentPrice = $(elem).find(".discount_final_price").text().trim();
    const prices = {discount, fullPrice, currentPrice};
    const topTag = $(elem).find(".top_tag")
    const platform_imgs = $(elem).find(".platform_img");
    const genres = [];
    const platforms = [];

    topTag.each((index, elem) => {
      genres.push($(elem).text().replace(", ", ""));
    });

    platform_imgs.each((index, elem) => {
      platforms.push(elem.attribs["class"].split(" ")[1]);
    })

    topSellerItems.push({id, url, title, cover_image, prices, genres, platforms});
  });

  return topSellerItems;
}

function scrapeGogGamePage(htmlString) {
  const $ = cheerio.load(htmlString);

  const pricesElem = $(".product-actions-price");
  const basePriceText = pricesElem.find(".product-actions-price__base-amount").text().trim();
  const finalPriceText = pricesElem.find(".product-actions-price__final-amount").text().trim();
  
  const finalPrice = parseFloat(finalPriceText);
  const basePrice = parseFloat(basePriceText);
  const discount = Math.round((basePrice - finalPrice) / basePrice * 100);

  return {
    prices: {
      discount: `${discount > 0 ? discount * -1 + "%" : discount}`,
      fullPrice: `$${basePriceText}`,
      currentPrice: `$${finalPriceText}`
    }
  };
}

function scrapeSteamGamePage(htmlString) {
  const $ = cheerio.load(htmlString);

  const pricesElem = $(".game_purchase_action").first();
    
  const basePriceText = (
    pricesElem.find(".discount_original_price").text().trim()
    || 
    pricesElem.find(".game_purchase_price").text().trim()
  );

  const finalPriceText = (
    pricesElem.find(".discount_final_price").text().trim()
    ||
    pricesElem.find(".game_purchase_price").text().trim()
  );

  const discountText = pricesElem.find(".discount_pct").text().trim() || "";

  return {
    prices: {
      discount: `${discountText ? discountText : 0}`,
      fullPrice: `${(basePriceText || finalPriceText) || 0}`,
      currentPrice: `${finalPriceText || 0}`
    }
  }
}

function scrapeEpicGamePage(htmlString) { 
  const $ = cheerio.load(htmlString);

  const pricesElem = $('[data-component="PriceLayout"]');

  if(!pricesElem) {
    return {
      prices: {
        discount: -1,
        fullPrice: -1,
        currentPrice: -1
      }
    }
  } 

  const basePriceText = pricesElem.find('[data-component="PDPDiscountedFromPrice"]').text().trim();
  const finalPriceText = pricesElem.find('span[data-component="Text"]').last().text().trim();
  const discountText = pricesElem.find('[data-component="BaseTag"]').text().trim();
  
  return {
    prices: {
      discount: discountText,
      fullPrice: basePriceText,
      currentPrice: finalPriceText
    }
  };
}

function formatHumbleResult(resObj) {
  const result = resObj.results[0];

  if(!result) return null;

  const {machine_name, human_name, human_url, full_price, current_price} = result;

  const discount = Number.parseInt((full_price.amount - current_price.amount) / full_price.amount * 100);
  
  return {
    id: machine_name,
    url: `https://www.humblebundle.com/store/${human_url.replace(/\s/, "-")}`,
    title: human_name, 
    prices: {
      discount: discount * -1,
      fullPrice: full_price.currency + " " + full_price.amount,
      currentPrice: current_price.currency + " " + current_price.amount
    },
  };
}

function formatGogResult(resObj) {
  const result = resObj.products[0];

  if(!result) return null;
  
  const {id, title, url, price} = result;
  
  return {
    id,
    url: `https://www.gog.com${url}`,
    title, 
    price: {
      discount: -1 * price.discountPercentage,
      fullPrice: `${price.symbol} ${price.baseAmount}`,
      currentPrice: `${price.symbol} ${price.finalAmount}`
    },
  };
}

function formatHumbleOffers(resObj) {
  const {results} = resObj;
  const offers = [];

  for(const product of results) {
    const {
        machine_name, human_name, human_url, 
        full_price, current_price, platforms,
        standard_carousel_image
      } = product;
    const discount = Number.parseInt((full_price.amount - current_price.amount) / full_price.amount * 100);

    const offer = {
      id: machine_name,
      url: `https://www.humblebundle.com/store/${human_url.replace(/\s/, "-")}`,
      title: human_name, 
      cover_image: standard_carousel_image,
      prices: {
        discount: `-${discount}%`,
        fullPrice: full_price.currency + " " + full_price.amount,
        currentPrice: current_price.currency + " " + current_price.amount
      },
      platforms
    }
    
    offers.push(offer);
  }

  return offers;
}

function formatGogOffers(resObj) {
  const {products} = resObj;
  const offers = [];

  for(const product of products) {
    const {id, title, image, url, price, genres, supportedOperatingSystems} = product;
    const {isDiscounted, discountPercentage, baseAmount, finalAmount, symbol} = price;

    const offer = {
      id, 
      url: `https://www.gog.com${url}`,
      title, 
      cover_image: `https:${image}.jpg`,
      genres,
      prices: {
        discount: isDiscounted ? `-${discountPercentage}%` : "0",
        fullPrice: `${symbol} ${baseAmount}`,
        currentPrice: `${symbol} ${finalAmount}`
      },
      platforms: supportedOperatingSystems
    };

    offers.push(offer);
  }
  
  return offers;
}

module.exports = {
  scrapeSteamSearch, 
  scrapeSteamOffers,
  scrapeSteamGamePage,
  scrapeGogGamePage,
  scrapeEpicGamePage,
  formatHumbleResult, 
  formatGogOffers,
  formatHumbleOffers,
  formatGogResult, 
};