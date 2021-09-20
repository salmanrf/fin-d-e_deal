import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaFacebookSquare, FaGlobe, FaYoutube } from "react-icons/fa";
import { FcWikipedia } from "react-icons/fc";

import { userStore, layoutStore } from "../store";
import useWishlists from "../hooks/useWishlists";
import useWebsites from "../hooks/useWebsites";
import {
  fetchGameById,
  fetchGameCompanies,
  fetchGameStores,
  fetchAddRemoveWishlist,
} from "../utils/games_api";

import Carousel from "../components/Carousel";

import loading from "../assets/img/loading.svg";

import placeholder from "../assets/img/placeholder.jpg";
import steamIcon from "../assets/img/steam.png";
import gogIcon from "../assets/img/gog.png";
import epicgamesIcon from "../assets/img/epicgames.png";

const websites = {
  1: {
    name: "Official site",
    icon: <FaGlobe />,
  },
  2: {
    name: "Wiki",
    icon: <FcWikipedia />,
  },
  4: {
    name: "Facebook",
    icon: <FaFacebookSquare />,
  },
  9: {
    name: "YouTube",
    icon: <FaYoutube />,
  },
};

const GamePage = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [companies, setCompanies] = useState([]);
  const { stores = null } = useWebsites(
    game && game.id,
    game && (game.websites instanceof Array ? game.websites : [])
  );

  useEffect(() => {
    fetchGameById(id)
      .then((res) => {
        if (res.success) {
          const { game } = res.data;
          const { involved_companies: companies } = game;

          setGame(game);

          return fetchGameCompanies(
            companies instanceof Array
              ? companies.map(({ company: name }) => name)
              : []
          );
        } else {
          throw res.errors;
        }
      })
      .then((res) => {
        if (res.success) {
          const { companies } = res.data;

          setCompanies(companies || []);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="game-page-container">
      <div className="game-cover-wishlist">
        <div className="game-cover">
          <img
            src={
              game && game.cover
                ? `https:${game.cover.replace("t_thumb", "t_cover_big")}`
                : placeholder
            }
            alt={`${(game && game.name) || "game"}'s cover`}
          />
        </div>
        <GameWishlist
          gameid={game && game.id}
          wishlistedBy={(game && game.wishlistedBy) || { count: 0, users: [] }}
        />
      </div>
      <div className="game-details">
        <header className="game-title">
          <span>{(game && game.name) || "Title"}</span>
        </header>
        <hr />
        <div className="details-section">
          <div className="section-title">
            <span>About</span>
          </div>
          <GameInfo
            title="Release Date: "
            data={
              (game &&
                new Date(
                  parseInt(game.first_release_date) * 1000
                ).toDateString()) ||
              ""
            }
          />
          <GameInfo
            title="Genre: "
            data={
              game && game.genres
                ? game.genres.reduce((prev, curr) => prev + curr + ",  ", "")
                : "genres..."
            }
          />
          {game && game.companies && (
            <GameInfo
              title="Developer: "
              data={
                companies instanceof Array &&
                game.involved_companies instanceof Array &&
                companies.reduce((prev, { id, name }, index) => {
                  const { involved_companies } = game;
                  const company =
                    involved_companies[
                      involved_companies.findIndex(
                        ({ company }) => company === id + ""
                      )
                    ];

                  if (!company) return prev;

                  return company.developer
                    ? prev + name + (index < companies.length - 1 ? ", " : "")
                    : prev;
                }, "")
              }
            />
          )}
          {game && game.companies && (
            <GameInfo
              title="Publisher: "
              data={
                companies instanceof Array &&
                game.involved_companies instanceof Array &&
                companies.reduce((prev, { id, name }, index) => {
                  const { involved_companies } = game;
                  const company =
                    involved_companies[
                      involved_companies.findIndex(
                        ({ company }) => company === id + ""
                      )
                    ];

                  if (!company) return prev;

                  return company.publisher
                    ? prev + name + (index < companies.length - 1 ? ", " : "")
                    : prev;
                }, "")
              }
            />
          )}
          <GameInfo
            title="Summary: "
            data={(game && game.summary) || "summary..."}
          />
          <div className="game-websites">
            {game &&
              game.websites instanceof Array &&
              game.websites.map(
                ({ category, url }) =>
                  websites[category] && (
                    <a
                      className="website-item"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      key={category}
                    >
                      {websites[category].icon}
                      <span>{websites[category].name}</span>
                    </a>
                  )
              )}
          </div>
        </div>
      </div>
      <GameScreenshots
        title={(game && game.name) || "title"}
        screenshots={
          game && game.screenshots instanceof Array ? game.screenshots : []
        }
      />
      <div className="game-available-stores details-section">
        <div className="section-title">
          <span>Available At: </span>
        </div>
        {stores ? (
          <>
            {stores && stores.steam && (
              <StoreItem
                name="Steam"
                icon={steamIcon}
                storeInfo={stores.steam}
              />
            )}
            {stores && stores.gog && (
              <StoreItem name="GOG" icon={gogIcon} storeInfo={stores.gog} />
            )}
            {stores && stores.epicgames && (
              <StoreItem
                name="Epic Games"
                icon={epicgamesIcon}
                storeInfo={stores.epicgames}
              />
            )}
          </>
        ) : (
          <h2 className="loading-stores">Searching for stores...</h2>
        )}
      </div>
    </div>
  );
};

const GameInfo = ({ title, data }) => {
  return (
    <div className="game-info">
      <span className="info-name">{title}</span>
      <span className="info-body">{data}</span>
    </div>
  );
};

const GameScreenshots = ({ title, screenshots }) => {
  return (
    <div className="game-screenshots">
      <Carousel
        items={screenshots}
        render={(image, key) => (
          <ScreenshotItem title={title} image={image} key={key} distance="10" />
        )}
      />
    </div>
  );
};

const ScreenshotItem = ({ title, image, distance = 0 }) => {
  return (
    <div
      className="carousel-item"
      style={{
        borderLeft: `${parseInt(distance) / 2}px solid hsl(220, 13%, 18%, 80%)`,
        borderRight: `${
          parseInt(distance) / 2
        }px solid hsl(220, 13%, 18%, 80%)`,
      }}
    >
      <div className="carousel-image">
        <img
          src={`http:${image}`.replace("t_thumb", "t_screenshot_huge")}
          alt={title}
        />
      </div>
    </div>
  );
};

const StoreItem = ({ storeInfo, icon, name }) => {
  const { url, prices } = storeInfo;
  const discount = parseInt(prices.discount.match(/\d+/));

  return (
    <a
      className="store-item"
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      <div id="store-item-steam" className="store-item-icon">
        <img src={icon} alt="steam logo" />
      </div>
      <div className="store-item-name">
        <span>{name}</span>
      </div>
      <div className="store-item-prices">
        {prices && prices.discount && discount > 0 && (
          <span className="store-item-discount">{prices.discount}</span>
        )}
        {prices && prices.fullPrice && discount > 0 && (
          <span className="store-item-fullprice">{prices.fullPrice}</span>
        )}
        {prices && prices.currentPrice && (
          <span className="store-item-currentprice">{prices.currentPrice}</span>
        )}
      </div>
    </a>
  );
};

const GameWishlist = ({ gameid, wishlistedBy }) => {
  const { token, user } = userStore((state) => state);
  const { isWishlisted, addToWishlist, removeFromWishlist } =
    useWishlists(gameid);
  const [isFetching, setIsFetching] = useState(false);
  const { setShowLoginForm } = layoutStore((state) => state);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setWishlistCount(wishlistedBy.count);
  }, [wishlistedBy]);

  async function addRemoveWishlist() {
    if (!user) {
      return setShowLoginForm(true);
    }

    setIsFetching(true);

    if (isWishlisted) {
      removeFromWishlist(gameid);
      setWishlistCount(wishlistCount - 1);

      const { success } = await fetchAddRemoveWishlist(gameid, token);

      if (!success) {
        setWishlistCount(wishlistCount + 1);
        addToWishlist(gameid);
      }
    } else {
      addToWishlist(gameid);
      setWishlistCount(wishlistCount + 1);

      const { success } = await fetchAddRemoveWishlist(gameid, token);

      if (!success) {
        setWishlistCount(wishlistCount - 1);
        removeFromWishlist(gameid);
      }
    }

    setIsFetching(false);
  }

  return (
    <div className="game-wishlist">
      <div className="wishlist-button" onClick={addRemoveWishlist}>
        {isWishlisted ? (
          <>
            {isFetching ? (
              <img src={loading} alt="loading" />
            ) : (
              <span>Wishlisted</span>
            )}
          </>
        ) : (
          <>
            {isFetching ? (
              <img src={loading} alt="loading" />
            ) : (
              <span>Add to Wishlist</span>
            )}
          </>
        )}
      </div>
      <div className="wishlist-count">
        <span>{wishlistCount} Wishlists</span>
      </div>
    </div>
  );
};

export default GamePage;
