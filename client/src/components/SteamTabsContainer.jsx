import { useState, useEffect } from "react";
import { FaSteam, FaApple, FaWindows, FaLinux } from "react-icons/fa";

import { API_URL } from "../utils/urls";

const SteamTabsContainer = ({ page, setIsLastPage }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState([]);

  useEffect(() => {
    if (games.length === 0) {
      setIsLastPage(true);
    } else {
      setIsLastPage(false);
    }
  }, [games]);

  useEffect(() => {
    setIsLoading(true);

    fetch(`${API_URL}/games/offers/steam/?page=${page}`)
      .then((res) => res.status === 200 && res.json())
      .then(({ offers }) => {
        setGames(offers);
        setIsLoading(false);
      })
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div id="offers-list">
      {!isLoading &&
        games.map((game) => <SteamTabItem game={game} key={game.id} />)}
    </div>
  );
};

const SteamTabItem = ({ game }) => {
  const { url, title, cover_image, platforms, prices, genres } = game;

  return (
    <a className="steam-tab-item" href={url} target="_blank" rel="noreferrer">
      <div className="tab-item-cover-image">
        <img src={cover_image} alt={`${title}'s cover`} />
      </div>
      <div className="tab-item-information">
        <div className="tab-item-title">
          <span>{title}</span>
        </div>
        <div className="tab-item-prices-platform">
          <div className="tab-item-platform">
            {platforms.map((pl) => {
              if (pl === "win") return <FaWindows key={pl} />;
              else if (pl === "mac") return <FaApple key={pl} />;
              else if (pl === "steam") return <FaSteam key={pl} />;
              else if (pl === "linux") return <FaLinux key={pl} />;
              else return null;
            })}
          </div>
          <div className="tab-item-prices">
            <div className="item-discount">
              <span>{prices.discount}</span>
            </div>
            <div className="item-price-base-current">
              <div className="price-base">
                <span>{prices.fullPrice}</span>
              </div>
              <div className="price-current">
                <span>{prices.currentPrice}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="tab-item-tags">
          <span>{genres.reduce((prev, curr) => prev + `${curr},  `, "")}</span>
        </div>
      </div>
    </a>
  );
};

export default SteamTabsContainer;
