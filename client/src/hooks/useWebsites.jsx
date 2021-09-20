import { useState, useEffect } from "react";

import { fetchGameStores } from "../utils/games_api";

const useWebsites = (gameid, websites) => {
  const [stores, setStores] = useState(null);

  useEffect(() => {
    if (gameid) {
      fetchGameStores(gameid, websites)
        .then((res) => {
          const { success } = res;

          if (success) {
            const { stores } = res.data;

            setStores(stores);
          }
        })
        .catch(() => null);
    }
  }, [gameid, websites]);

  return { stores };
};

export default useWebsites;
