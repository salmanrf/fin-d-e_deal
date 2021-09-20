import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";

import { fetchSearchGames } from "../utils/games_api";

import SearchResultItem from "./SearchResultItem";

const SearchContainer = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [keyword, setKeyword] = useState(
    new URLSearchParams(location.search).get("keyword")
  );
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  useEffect(() => {
    setKeyword(new URLSearchParams(location.search).get("keyword"));
  }, [location]);

  useEffect(() => {
    if (results.length < 10) {
      setIsLastPage(true);
    } else {
      setIsLastPage(false);
    }
  }, [results]);

  useEffect(() => {
    fetchSearchGames(keyword, page).then((res) => {
      const { success, data } = res;

      if (success) {
        const { games } = data;

        setResults(games);
      }
    });
  }, [keyword, page]);

  return (
    <main id="search-container">
      <header>
        <span>Showing results for:</span>
        <div className="line" />
        <span>{keyword}</span>
        <div className="line" />
      </header>
      <div className="search-results">
        {results.map((game) => (
          <SearchResultItem game={game} key={game.id} />
        ))}
      </div>
      <div className="page-navigation">
        {page > 1 && (
          <div onClick={() => setPage(page - 1)}>
            <MdNavigateBefore />
          </div>
        )}
        {/* Steam page starts from 0, others with 1 */}
        <span>{page}</span>
        {results.length >= 10 && !isLastPage && (
          <div onClick={() => setPage(page + 1)}>
            <MdNavigateNext />
          </div>
        )}
      </div>
    </main>
  );
};

export default SearchContainer;
