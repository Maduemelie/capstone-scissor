const express = require("express");
const session = require("express-session");
const passport = require('./config/passport')
const authRouter = require('./routes/userRoute')
const shortUrlRoute = require('./routes/shortUrlRoute')

require("dotenv").config();

const app = express();

app.use(session({
  secret: process.env.MY_SESSION_SECERT,
  resave: false,
  saveUninitialized: false
}));
//import rate limiter
const rateLimit = require("express-rate-limit");
const errorcontroller = require("./controllers/errorcontroller");
const AppError = require('./utils/AppError')

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
  } 
});
app.use(limiter)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use("/Users", authRouter)
app.use("/shortUrl", shortUrlRoute)



app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/html/Login.html");
});

app.all('*', (req, res, next) => {
  next(new AppError(` can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorcontroller)

module.exports = app;
