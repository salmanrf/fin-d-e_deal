import { wrapTryCatch } from "./promise_utils";

export async function fetchCurrentUser(token) {
  const [response, errors] = await wrapTryCatch(
    fetch("http://localhost:8000/api/v1/users/current", {
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
    fetch("http://localhost:8000/api/v1/users/current/wishlists", {
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
