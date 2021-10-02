import { useState, useEffect } from "react";
import { HiOutlineMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import { AiOutlineCloseCircle } from "react-icons/ai";

import { userStore } from "../store";

import { wrapTryCatch } from "../utils/promise_utils";
import { fetchLogin } from "../utils/auth_api";

import loading from "../assets/img/loading.svg";

const LoginForm = (props) => {
  const { setToken, setUser } = userStore(({ setToken, setUser }) => ({
    setToken,
    setUser,
  }));
  const { close } = props;
  const [isMounted, setIsMounted] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otherError, setOtherError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formValid, setFormValid] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  function unmountAndClose(timeout = 250) {
    setIsMounted(false);
    setTimeout(() => close(), timeout);
  }

  async function submitLogin(e) {
    e.preventDefault();

    setIsFetching(true);

    const [res, err] = await wrapTryCatch(fetchLogin({ username, password }));
    let { success = false } = {};

    if (res && res.success) {
      success = true;
    }

    if (err) {
      setOtherError(err.message || "");

      return setIsFetching(false);
    }

    if (!success) {
      const { errors } = res;
      const { username = { msg: "" }, password = { msg: "" } } = errors;

      setUsernameError(username.msg || "");
      setPasswordError(password.msg || "");
      setUsername("");
      setPassword("");
      setFormValid(false);

      return setIsFetching(false);
    }

    if (success && res.data) {
      const { token, user } = res.data;

      setToken(token);
      setUser(user);

      setIsFetching(false);
      unmountAndClose(150);
    }
  }

  return (
    <div
      id="login"
      className="user-forms"
      style={{ top: isMounted ? "50%" : "-100%" }}
    >
      <div className="close-btn" onClick={() => unmountAndClose(250)}>
        <AiOutlineCloseCircle />
      </div>
      <header>
        <span>Login</span>
      </header>
      <form action="" onSubmit={submitLogin}>
        <UserInput
          username={{ value: username, set: (str) => setUsername(str) }}
        />
        <PasswordInput
          password={{ value: password, set: (str) => setPassword(str) }}
        />
        {!formValid && (
          <div className="form-validation">
            {usernameError && <p>Username: {usernameError}</p>}
            {passwordError && <p>Password: {passwordError}</p>}
            {otherError && <p>{otherError}</p>}
          </div>
        )}
        <button type="submit" className="action-btn">
          {isFetching ? (
            <img src={loading} alt="loading icon" />
          ) : (
            <span>LOGIN</span>
          )}
        </button>
      </form>
    </div>
  );
};

const UserInput = ({ username }) => {
  const { value, set } = username;

  return (
    <div className="form-input">
      <div className="input-icon">
        <HiOutlineMail />
      </div>
      <input
        name="username"
        type="text"
        placeholder="Username"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
};

const PasswordInput = ({ password }) => {
  const { value, set } = password;

  return (
    <div className="form-input">
      <div className="input-icon">
        <RiLockPasswordLine />
      </div>
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
};

export default LoginForm;
