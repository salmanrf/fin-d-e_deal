import { useState, useEffect } from "react";
import { Redirect, Link } from "react-router-dom";

import { userStore } from "../store";
import useWebsites from "../hooks/useWebsites";
import { fetchCurrentUserWishlist } from "../utils/users_api";

import steamIcon from "../assets/img/steam.png";
import gogIcon from "../assets/img/gog.png";
import epicgamesIcon from "../assets/img/epicgames.png";

const UserPage = () => {
  const { token, user } = userStore(({ token, user }) => ({ token, user }));
  const [wishlists, setWishlists] = useState([]);

  useEffect(() => {
    fetchCurrentUserWishlist(token)
      .then((res) => {
        const { success, data } = res;

        if (success) {
          const { wishlists } = data;
          setWishlists(wishlists);
        }
      })
      .catch(() => null);
  }, [user]);

  if (!user) {
    return <Redirect to="/" />;
  }

  return (
    <main id="user-page-container">
      <header>
        <span>{user.fullName}'s Wishlist</span>
        <div className="line"></div>
      </header>
      <div className="user-wishlist-container">
        {wishlists.map((wl) => (
          <UserWishlistItem game={wl} key={wl._id} />
        ))}
      </div>
    </main>
  );
};

const UserWishlistItem = ({ game }) => {
  const { _id, cover, name } = game;
  const { stores } = useWebsites(_id);
  const { steam, gog, epicgames } = stores || {};

  return (
    <div className="search-result-item">
      <Link className="cover" to={`/games/${_id}`}>
        <img
          src={`http:${(cover.url || cover).replace("t_thumb", "t_cover_big")}`}
          alt={`${name}'s cover'`}
        />
      </Link>
      <div className="info">
        <Link className="title" to={`/games/${_id}`}>
          <span>{name}</span>
        </Link>
        <div className="stores">
          {steam && <StoreItem icon={steamIcon} store={steam} />}
          {gog && <StoreItem icon={gogIcon} store={gog} />}
          {epicgames && <StoreItem icon={epicgamesIcon} store={epicgames} />}
        </div>
      </div>
    </div>
  );
};

const StoreItem = ({ store, icon, name }) => {
  const { url, prices } = store;
  const discount = parseInt(prices.discount.match(/\d+/));

  return (
    <a className="store-item" href={url} target="_blank" rel="noreferrer">
      <div id="store-item-steam" className="store-item-icon">
        <img src={icon} alt="store's logo" />
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

export default UserPage;
