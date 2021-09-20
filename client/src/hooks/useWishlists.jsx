import { useState, useEffect } from "react";

import { userStore } from "../store";

const useWishlists = (gameid) => {
  const { wishlists, addToWishlist, removeFromWishlist } = userStore(
    (state) => state
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(
      wishlists instanceof Array &&
        wishlists.map(({ _id }) => _id + "").includes(gameid + "")
    );
  }, [gameid, wishlists]);

  return { isWishlisted, addToWishlist, removeFromWishlist };
};

export default useWishlists;
