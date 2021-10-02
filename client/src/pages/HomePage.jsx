import { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import { Switch, Route } from "react-router-dom";
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";

import HeroSection from "../components/HeroSection";
import Carousel from "../components/Carousel";
import MostPopularItem from "../components/MostPopularItem";
import SteamOffersItem from "../components/SteamOffersItem";
import HumbleOffersItem from "../components/HumbleOffersItem";
import SteamTabsContainer from "../components/SteamTabsContainer";
import HumbleTabsContainer from "../components/HumbleTabsContainer";
import GogTabsContainer from "../components/GogTabsContainer";
import SearchContainer from "../components/SearchContainer";

import steamIcon from "../assets/img/steam.png";
import humbleIcon from "../assets/img/humble-bundle.png";

const HomePage = (props) => {
  return (
    <>
      <HeroSection />
      <Switch>
        <Route path="/games/search">
          <SearchContainer />
        </Route>
        <Route path="/" exact>
          <main>
            <MostPopularGames />
            <SteamOffersHighlight />
            <HumbleOffersHighlight />
            <OtherOfferTabs />
          </main>
        </Route>
        <Route path="/games" exact>
          <main>
            <MostPopularGames />
            <SteamOffersHighlight />
            <HumbleOffersHighlight />
            <OtherOfferTabs />
          </main>
        </Route>
      </Switch>
    </>
  );
};

const OtherOfferTabs = (props) => {
  // 0 === steam, 1 === humble-bundle, 2 === gog
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [steamPage, setSteamPage] = useState(1);
  const [humblePage, setHumblePage] = useState(1);
  const [gogPage, setGogPage] = useState(1);
  const [steamIsLastPage, setSteamIsLastPage] = useState(false);
  const [gogIsLastPage, setGogIsLastPage] = useState(false);
  const [humbleIsLastPage, setHumbleIsLastPage] = useState(false);

  return (
    <div id="other-offers-tabs">
      <header>
        <span>Other Offers</span>
      </header>
      <div className="retailer-list">
        <div
          className={`retailer-tab ${currentTab === 0 ? "tab-active" : ""}`}
          onClick={() => setCurrentTab(0)}
        >
          <span>Steam</span>
        </div>
        <div
          className={`retailer-tab ${currentTab === 1 ? "tab-active" : ""}`}
          onClick={() => setCurrentTab(1)}
        >
          <span>Humble Bundle</span>
        </div>
        <div
          className={`retailer-tab ${currentTab === 2 ? "tab-active" : ""}`}
          onClick={() => setCurrentTab(2)}
        >
          <span>GOG</span>
        </div>
      </div>
      {[
        <SteamTabsContainer
          page={steamPage}
          setIsLastPage={setSteamIsLastPage}
        />,
        <HumbleTabsContainer
          page={humblePage}
          setIsLastPage={setHumbleIsLastPage}
        />,
        <GogTabsContainer page={gogPage} setIsLastPage={setGogIsLastPage} />,
      ][currentTab] || null}
      <div className="page-navigation">
        <div
          onClick={() => {
            const pages = [steamPage, humblePage, gogPage];
            const setters = [setSteamPage, setHumblePage, setGogPage];

            setters[currentTab](
              pages[currentTab] === 1 ? 1 : pages[currentTab] - 1
            );
          }}
        >
          {[steamPage, humblePage, gogPage][currentTab] > 1 && (
            <MdNavigateBefore />
          )}
        </div>
        {/* Steam page starts from 0, others with 1 */}
        <span>{[steamPage, humblePage, gogPage][currentTab]}</span>
        <div
          onClick={() => {
            const pages = [steamPage, humblePage, gogPage];
            const setters = [setSteamPage, setHumblePage, setGogPage];

            setters[currentTab](pages[currentTab] + 1);
          }}
        >
          {![steamIsLastPage, humbleIsLastPage, gogIsLastPage][currentTab] && (
            <MdNavigateNext />
          )}
        </div>
      </div>
    </div>
  );
};

const MostPopularGames = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`http://54.169.122.134:8000/api/v1/games/wishlist`)
      .then((res) => res.status === 200 && res.json())
      .then(({ games }) => {
        setGames(games);
        setIsLoading(false);
      })
      .catch(() => null);
  }, []);

  return (
    <section id="most-popular-games" className="section-highlight">
      <header>
        <FaHeart />
        <span>Most Popular Games</span>
      </header>
      <Carousel
        items={games}
        render={(game, key) => (
          <MostPopularItem game={game} key={key} distance="5" />
        )}
      />
    </section>
  );
};

const SteamOffersHighlight = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch("http://54.169.122.134:8000/api/v1/games/offers/steam/?page=1")
      .then((res) => res.status === 200 && res.json())
      .then(({ offers }) => {
        setOffers(offers);
        setIsLoading(false);
      })
      .catch(() => null);
  }, []);

  return (
    <section className="section-highlight">
      <header>
        <div className="icon">
          <img src={steamIcon} alt="steam icon" />
        </div>
        <span>Steam's Special Offers</span>
      </header>
      <Carousel
        items={offers}
        keyName={"id"}
        render={(game, key) => (
          <SteamOffersItem game={game} key={key} distance="5" />
        )}
      />
    </section>
  );
};

const HumbleOffersHighlight = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(
      "http://54.169.122.134:8000/api/v1/games/offers/humble-bundle/?page=1"
    )
      .then((res) => res.status === 200 && res.json())
      .then(({ offers }) => setGames(offers))
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="section-highlight">
      <header>
        <div className="icon">
          <img src={humbleIcon} alt="humble-bundle icon" />
        </div>
        <span>Humble Bundle's Special Offers</span>
      </header>
      <Carousel
        items={games}
        keyName={"id"}
        render={(game, key) => (
          <HumbleOffersItem game={game} key={key} distance="5" />
        )}
      />
    </section>
  );
};

export default HomePage;
