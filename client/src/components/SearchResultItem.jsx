import { Link } from "react-router-dom";

const SearchResultItem = ({ game }) => {
  const { id, cover, name, first_release_date } = game;

  return (
    <Link className="search-result-item" to={`/games/${id}`}>
      <div className="cover">
        <img
          src={`https:${cover.replace("t_thumb", "t_cover_big")}`}
          alt={`${name}'s cover'`}
        />
      </div>
      <div className="info">
        <div className="title">
          <span>{name}</span>
          <div className="release-year">
            <span>
              ({new Date(parseInt(first_release_date) * 1000).getFullYear()})
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SearchResultItem;
