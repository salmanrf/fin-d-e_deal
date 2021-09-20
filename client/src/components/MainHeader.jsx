import { useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaUserCircle } from "react-icons/fa";

import { userStore } from "../store";
import { fetchLogout } from "../utils/auth_api";

import logo from "../assets/img/logo.png";

const MainHeader = (props) => {
  const { token, user, setToken, setUser, wishlistCount } = userStore(
    (store) => store
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { showLogin, showSignup } = props;

  function logout(e) {
    e.stopPropagation();

    fetchLogout(token).then(() => {
      setToken(null);
      setUser(null);
    });
  }

  return (
    <header id="main-header">
      <Link className="logo" to="/">
        <img src={logo} alt="logo" />
      </Link>
      <div
        className="hamburger-btn"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div
        className="user-menu"
        style={{ height: showUserMenu ? "150px" : "0" }}
        onClick={() => setShowUserMenu(false)}
      >
        {token ? (
          user && (
            <>
              <Link className="user-menu-item" to="/user">
                <span>{user.fullName}</span>
              </Link>
              <div className="user-menu-item">
                <Link className="wishlist-count" to="/user">
                  <FaHeart />
                  <span>{wishlistCount}</span>
                </Link>
                <span>Wishlists</span>
              </div>
              <div className="login-signup-btn">
                <div id="logout-btn" className="btn" onClick={logout}>
                  <span>Logout</span>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="login-signup-btn">
            <div className="btn" onClick={showLogin}>
              <FaUserCircle />
              <span>Login</span>
            </div>
            <div className="btn" onClick={showSignup}>
              <span>Signup</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainHeader;
