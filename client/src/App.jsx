import { useState, useEffect } from "react";
import { Switch, Route } from "react-router-dom";

import { userStore, layoutStore } from "./store";
import { fetchRefresh } from "./utils/auth_api";
import { fetchCurrentUser } from "./utils/users_api";

import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import UserPage from "./pages/UserPage";
import MainHeader from "./components/MainHeader";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";

import "./Sass/styles.scss";

const App = () => {
  const { token, setToken, setUser } = userStore((store) => store);
  const { showLoginForm, showSignupForm, setShowLoginForm, setShowSignupForm } =
    layoutStore((state) => state);

  useEffect(() => {
    document.title = "Fin(d)e Deal";

    fetchRefresh()
      .then(({ data }) => {
        const { token } = data;

        if (token) setToken(data.token);

        return fetchCurrentUser(token);
      })
      .then((res) => {
        if (res.success) {
          const { user } = res.data;

          setUser(user);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchRefresh()
        .then(({ data }) => {
          const { token } = data;

          if (token) {
            setToken(data.token);
          }
        })
        .catch(() => null);
    }, 1000 * 60 * 15);
  }, [token]);

  useEffect(() => {
    (showLoginForm && setShowSignupForm(false)) ||
      (showSignupForm && setShowLoginForm(false));

    showLoginForm || showSignupForm
      ? (document.body.style.overflowY = "hidden")
      : (document.body.style.overflowY = "scroll");
  }, [showLoginForm, showSignupForm]);

  return (
    <div className="app">
      <MainHeader
        showLogin={() => setShowLoginForm(true)}
        showSignup={() => setShowSignupForm(true)}
      />
      {(showLoginForm || showSignupForm) && <div className="form-overlay" />}
      {(showLoginForm && <LoginForm close={() => setShowLoginForm(false)} />) ||
        (showSignupForm && (
          <SignupForm close={() => setShowSignupForm(false)} />
        ))}
      <Switch>
        <Route exact path="/">
          <HomePage />
        </Route>
        <Route path="/user">
          <UserPage />
        </Route>
        <Route exact path="/games">
          <HomePage />
        </Route>
        <Route exact path="/games/search">
          <HomePage />
        </Route>
        <Route path="/games/:id">
          <GamePage />
        </Route>
      </Switch>
    </div>
  );
};

export default App;
