import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaRegHeart, FaHeart } from "react-icons/fa";

import { userStore, layoutStore } from "../store";
import useWishlists from "../hooks/useWishlists";
import { fetchAddRemoveWishlist } from "../utils/games_api";

const MostPopularItem = ({ game, distance = 0 }) => {
  const { _id, name, cover, genres, wishlistedBy } = game;
  const { token, user } = userStore((state) => state);
  const { setShowLoginForm } = layoutStore((state) => state);
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlists(_id);
  const [wishlistCount, setWishlistCount] = useState(wishlistedBy.count);

  async function addRemoveWishlist() {
    if (!user) {
      return setShowLoginForm(true);
    }

    if (isWishlisted) {
      removeFromWishlist(_id);
      setWishlistCount(wishlistCount - 1);

      const { success } = await fetchAddRemoveWishlist(_id, token);

      if (!success) {
        setWishlistCount(wishlistCount + 1);
        return addToWishlist(_id);
      }
    } else {
      addToWishlist(_id);
      setWishlistCount(wishlistCount + 1);

      const { success } = await fetchAddRemoveWishlist(_id, token);

      if (!success) {
        setWishlistCount(wishlistCount - 1);
        return removeFromWishlist(_id);
      }
    }
  }

  return (
    <div
      className="carousel-item-portrait"
      style={{
        borderLeft: `${parseInt(distance) / 2}px solid hsl(220, 13%, 18%, 80%)`,
        borderRight: `${
          parseInt(distance) / 2
        }px solid hsl(220, 13%, 18%, 80%)`,
      }}
    >
      <Link className="carousel-image" to={`/games/${_id}`}>
        <img
          src={`https:${cover.replace("t_thumb", "t_cover_big")}`}
          alt={`${name}'s cover`}
        />
      </Link>
      <div className="popular-game-info">
        <Link className="name-genres" to={`/games/${_id}`}>
          <span className="name">{name}</span>
          <span className="genres">
            {genres instanceof Array &&
              genres.reduce(
                (prev, curr, index) =>
                  prev + `${curr}${index < genres.length - 1 ? "," : ""}  `,
                ""
              )}
          </span>
        </Link>
        <div className="wishlist-count">
          {isWishlisted ? (
            <div onClick={addRemoveWishlist}>
              <FaHeart />
            </div>
          ) : (
            <div onClick={addRemoveWishlist}>
              <FaRegHeart />
            </div>
          )}
          <span>{wishlistCount}</span>
        </div>
      </div>
    </div>
  );
};

export default MostPopularItem;
