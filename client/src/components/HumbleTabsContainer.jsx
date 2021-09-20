import { useState, useEffect } from "react";
import { FaSteam, FaApple, FaWindows, FaLinux } from "react-icons/fa";

const HumbleTabsContainer = ({ page, setIsLastPage }) => {
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

    fetch(
      `http://localhost:8000/api/v1/games/offers/humble-bundle/?page=${page}`
    )
      .then((res) => res.status === 200 && res.json())
      .then(({ offers }) => {
        setGames(offers);
        setIsLoading(false);
      });
  }, [page]);

  return (
    <div id="offers-list">
      {!isLoading &&
        games.map((game) => <HumbleTabItem game={game} key={game.id} />)}
    </div>
  );
};

const HumbleTabItem = ({ game }) => {
  const { url, cover_image, title, platforms, prices } = game;

  return (
    <a className="humble-tab-item" href={url} target="_blank" rel="noreferrer">
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
              if (pl === "windows") return <FaWindows key={pl} />;
              else if (pl === "apple") return <FaApple key={pl} />;
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
              <div className="price-current">
                <span>{prices.currentPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default HumbleTabsContainer;
