const express = require("express");
const session = require("express-session");
const passport = require('./config/passport')
const authRouter = require('./routes/userRoute')

require("dotenv").config();

const app = express();

app.use(session({
  secret: process.env.MY_SESSION_SECERT,
  resave: false,
  saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use("/Users", authRouter)



app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/html/Login.html");
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({message: err.message})
});

module.exports = app;
