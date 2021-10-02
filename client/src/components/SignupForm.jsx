import { useState, useEffect } from "react";
import { HiOutlineMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa";

import { wrapTryCatch } from "../utils/promise_utils";
import { fetchSignup } from "../utils/auth_api";

import loading from "../assets/img/loading.svg";

const SignupForm = (props) => {
  const { close } = props;
  const [isMounted, setIsMounted] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [otherError, setOtherError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [repeatPasswordError, setRepeatPasswordError] = useState("");
  const [formValid, setFormValid] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  function unmountAndClose(timeout = 250) {
    setIsMounted(false);
    setTimeout(() => close(), timeout);
  }

  async function submitSignup(e) {
    e.preventDefault();

    if (password !== repeatPassword) {
      setRepeatPasswordError("Passwords didn't match");
      return setFormValid(false);
    }

    setIsFetching(true);

    const [res, err] = await wrapTryCatch(
      fetchSignup({ fullName, username, password })
    );
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
      const {
        fullName = { msg: "" },
        username = { msg: "" },
        password = { msg: "" },
      } = errors;

      setFullNameError(fullName.msg || "");
      setUsernameError(username.msg || "");
      setPasswordError(password.msg || "");
      setPassword("");
      setFormValid(false);

      return setIsFetching(false);
    }

    if (success) {
      setIsFetching(false);
      unmountAndClose(150);
    }
  }

  return (
    <div
      id="signup"
      className="user-forms"
      style={{ top: isMounted ? "50%" : "-100%" }}
    >
      <div className="close-btn" onClick={() => unmountAndClose(250)}>
        <AiOutlineCloseCircle />
      </div>
      <header>
        <span>Signup</span>
      </header>

      <form action="" onSubmit={submitSignup}>
        <FullNameInput
          fullName={{ value: fullName, set: (str) => setFullName(str) }}
        />
        <UserInput
          username={{ value: username, set: (str) => setUsername(str) }}
        />
        <PasswordInput
          password={{ value: password, set: (str) => setPassword(str) }}
        />
        <RepeatPasswordInput
          repeatPassword={{
            value: repeatPassword,
            set: (str) => setRepeatPassword(str),
          }}
        />
        {!formValid && (
          <div className="form-validation">
            {fullNameError && <p>Full name: {fullNameError}</p>}
            {usernameError && <p>Username: {usernameError}</p>}
            {passwordError && <p>Password: {passwordError}</p>}
            {repeatPasswordError && <p>Password: {repeatPasswordError}</p>}
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

const FullNameInput = ({ fullName }) => {
  const { value, set } = fullName;

  return (
    <div className="form-input">
      <div className="input-icon">
        <FaUserCircle />
      </div>
      <input
        name="Full name"
        type="text"
        placeholder="Full name"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
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

const RepeatPasswordInput = ({ repeatPassword }) => {
  const { value, set } = repeatPassword;

  return (
    <div className="form-input">
      <div className="input-icon">
        <RiLockPasswordLine />
      </div>
      <input
        name="password"
        type="password"
        placeholder="Repeat password"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
};

export default SignupForm;
