const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const authRouter = require("./routes/userRoute");
const shortUrlRoute = require("./routes/shortUrlRoute");
const HomeRoute = require("./routes/homeRoutes");
const ejs = require("ejs");
require("dotenv").config();
const path = require("path");
const cors = require("cors");

const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "html")); // Set the folder where the EJS template files are located

app.use(
  session({
    // Set up express-session middleware
    secret: process.env.MY_SESSION_SECERT,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(cors()); // Set up CORS middleware

//import rate limiter
const rateLimit = require("express-rate-limit");
const errorcontroller = require("./controllers/errorcontroller");
const AppError = require("./utils/AppError");

// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // Max 10 requests per windowMs
  message: "Too many requests, please try again later.",
  statusCode: 429,
  headers: {
    // Custom headers
    "Retry-After": 600, // Retry after 10 minutes
    "X-RateLimit-Limit": 60,
    "X-RateLimit-Remaining": 0,
    "X-RateLimit-Reset": Date.now() + 10 * 60 * 1000,
  },
  keyGenerator: (req) => {
    // Custom key generator
    return req.ip; // Use client IP address as the key
  },
});
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

// Set up routes
app.use("/Users", authRouter);
app.use("/shortUrl", shortUrlRoute);
app.use( HomeRoute);



app.all("*", (req, res, next) => {
  next(new AppError(` can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorcontroller); //error controller


module.exports = app;
