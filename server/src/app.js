const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const app = express();
const games_route = require("./routes/games_route");
const auth_route = require("./routes/auth_route");
const user_route = require("./routes/user_route");

app.use(helmet());

app.use((req, res, next) => {
  const allowedOrigins = [process.env.ALLOWED_ORIGIN];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);

    res.set({
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": ["Content-Type", "Authorization"],
      "Access-Control-Allow-Methods": ["POST", "PATCH", "DELETE"],
    });
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(cookieParser());
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/v1/games", games_route);
app.use("/api/v1/users", user_route);
app.use("/api/v1/auth", auth_route);
app.use("/", (req, res) => res.sendStatus(404));

app.use((error, req, res) => res.status(500).json({ error: { message: error.message } }));

module.exports = app;
