const User = require("../model/userModel");
const passport = require("passport");
const path = require("path");
const helper = require("../utils/helper");

const userSignUp = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // Create a new user instance
    const newUser = new User({ username, email, password });

    // Save the new user to the database
    await newUser.save();

    req.login(newUser, async (error) => {
      if (error) {
        return res.render("Register", { error });
      }

      // Redirect to the Home page
      const userId = newUser._id;
      const shortURLs = await helper.getShortURLsForUser(userId);
      res.render("Home", { shortURLs });
    });
  } catch (error) {
    res.render("Register", { error });
  }
};

const userLogin = (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) {
      return res.render("Login");
    }

    if (!user) {
      return res.render("Login");
    }

    req.login(user, async (err) => {
      if (err) {
        return res.render("Login");
      }
      const userId = user._id;
      const shortURLs = await helper.getShortURLsForUser(userId);

      // Limit the shortURLs to the last 3 URLs
      const lastThreeURLs = shortURLs.slice(-3);

      return res.render("Home", { shortURLs: lastThreeURLs });
    });
  })(req, res, next);
};

module.exports = { userSignUp, userLogin };
