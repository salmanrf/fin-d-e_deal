import { wrapTryCatch } from "./promise_utils";
import { API_URL } from "./urls";

export async function fetchGameById(gameid) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/games/igdb/item/${gameid}`)
  );

  if (errors) {
    return { success: false, errors };
  }

  if (response.status === 200) {
    const [{ game }, errors] = await wrapTryCatch(response.json());

    if (errors) return { success: false, errors };

    return { success: true, data: { game } };
  }
}

export async function fetchGameCompanies(companies = []) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/games/igdb/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        involved_companies:
          companies instanceof Array ? companies : [companies],
      }),
    })
  );

  if (errors) {
    return { success: false, errors };
  }

  if (response.status === 200) {
    const [{ companies }, errors] = await wrapTryCatch(response.json());

    if (errors) return { success: false, errors };

    return { success: true, data: { companies } };
  }
}

// websites is a array of object, each must have url and category as properties
export async function fetchGameStores(gameid, websites) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/games/igdb/item/${gameid}/stores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ websites }),
    })
  );

  if (errors) {
    return { success: false, errors };
  }

  if (response.status === 200) {
    const [{ stores }, errors] = await wrapTryCatch(response.json());

    if (errors) return { success: false, errors };

    return { success: true, data: { stores } };
  }
}

export async function fetchSearchGames(keyword, page) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/games/search/?keyword=${keyword}&page=${page}`)
  );

  if (errors) {
    return { success: false, errors };
  }

  if (response.status === 200) {
    const [{ games }, errors] = await wrapTryCatch(response.json());

    if (errors) return { success: false, errors };

    return { success: true, data: { games } };
  }
}

export async function fetchAddRemoveWishlist(gameid, token) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/games/wishlist`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: gameid,
    })
  );

  if (errors) {
    return { success: false, errors };
  }

  if (response.status === 201) {
    return { success: true };
  } else {
    return { success: false };
  }
}
