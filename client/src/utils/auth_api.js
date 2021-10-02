import { wrapTryCatch } from "./promise_utils";

const API_URL = "http://54.169.122.134:8000/api/v1";

export async function fetchSignup(credentials) {
  const { fullName, username, password } = credentials;

  let [res, err] = await wrapTryCatch(
    fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, username, password }),
    })
  );

  const { status } = res;

  if (err) {
    return { success: false, errors: { msg: "Error connecting to server" } };
  }

  [res, err] = await wrapTryCatch(res.json());

  if (status === 201) {
    const { user } = res;

    return { success: true, data: { user } };
  } else {
    return { success: false, errors: { ...res.errors } };
  }
}

export async function fetchLogin(credentials) {
  const { username, password } = credentials;

  let [res, err] = await wrapTryCatch(
    fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
  );

  const { status } = res;

  if (err) {
    return { success: false, errors: { msg: "Error connecting to server" } };
  }

  [res, err] = await wrapTryCatch(res.json());

  if (status === 200) {
    const { token, user } = res;

    return { success: true, data: { token, user } };
  } else {
    return { success: false, errors: { ...res.errors } };
  }
}

export async function fetchLogout(token) {
  const { status } = await fetch(`${API_URL}/auth/signout`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (status === 200) return { success: true };
  else return { success: false };
}

export async function fetchRefresh() {
  const [res, err] = await wrapTryCatch(
    fetch(`${API_URL}/auth/refresh`, {
      credentials: "include",
    })
  );

  if (err)
    return { success: false, errors: { msg: "Error connecting to server" } };

  if (res.status === 200) {
    const { token } = await res.json();

    return { success: true, data: { token } };
  } else {
    return { success: false };
  }
}
