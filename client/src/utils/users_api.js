import { wrapTryCatch } from "./promise_utils";

const API_URL = "http://54.169.122.134:8000/api/v1";

export async function fetchCurrentUser(token) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/users/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  if (errors) {
    return { success: false, errors };
  }

  const result = await response.json();

  if (response.status === 200) {
    const { user } = result;

    return { success: true, data: { user } };
  } else {
    return { success: false, errors: { msg: "Invalid / token has expired" } };
  }
}

export async function fetchCurrentUserWishlist(token) {
  const [response, errors] = await wrapTryCatch(
    fetch(`${API_URL}/users/current/wishlists`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  if (errors) {
    return { success: false, errors };
  }

  if (response.status === 200) {
    const [{ wishlists }, errors] = await wrapTryCatch(response.json());

    if (errors) return { success: false, errors };

    return { success: true, data: { wishlists } };
  } else {
    return { success: false, status: response.status };
  }
}
