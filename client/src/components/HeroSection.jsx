import { useState, useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

import logo from "../assets/img/logo.png";
import heroImg from "../assets/img/hero-image.jpg";

const HeroSection = (props) => {
  const [keyword, setKeyword] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timeoutId, setTimeOutId] = useState(null);
  const history = useHistory();

  useEffect(() => {
    clearTimeout(timeoutId);

    if (keyword) {
      setTimeOutId(
        setTimeout(() => {
          submitSearchRecs();
        }, 250)
      );
    }
  }, [keyword]);

  function submitSearch(e) {
    e.preventDefault();

    history.push(`/games/search/?keyword=${keyword}`);
  }

  function submitSearchRecs() {
    fetch(`http://localhost:8000/api/v1/games/searchrecs/?keyword=${keyword}`)
      .then((res) => res.status === 200 && res.json())
      .then(({ recommendations }) => setRecommendations(recommendations))
      .catch(() => null);
  }

  return (
    <div id="hero-section" style={{ backgroundImage: `url(${heroImg})` }}>
      <div className="logo">
        <img src={logo} alt="logo" />
      </div>
      <h2>Find the best price for your game</h2>
      <form
        onSubmit={submitSearch}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
      >
        <input
          name="keyword"
          type="text"
          placeholder="Dark Souls Remastered..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="icon">
          <FiSearch />
        </div>
        {keyword && showSuggestions && (
          <div className="search-recommendations">
            {recommendations.map((rec) => (
              <Link
                className="recommendation-item"
                to={`/games/search/?keyword=${rec}`}
              >
                <span>{rec}</span>
              </Link>
            ))}
          </div>
        )}
      </form>
      <div className="filter-overlay" />
    </div>
  );
};

export default HeroSection;
