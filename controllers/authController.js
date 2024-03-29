const User = require('../model/userModel');
const passport = require('passport');
const path = require('path');
const helper = require('../utils/helper');

const userSignUp = async (req, res) => {
  const { username, email, password } = req.body;
  const limit = 5;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already taken' });
    }

    const newUser = new User({ username, email, password });

    await newUser.save();

    req.login(newUser, async (error) => {
      if (error) {
        return res.render('Register', { error });
      }

      const userId = newUser._id;
      const shortURLs = await helper.getShortURLsForUser(userId);
      res.render('Home', { shortURLs, limit });
    });
  } catch (error) {
    res.render('Register', { error });
  }
};

const userLogin = (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) {
      return res.render('Login');
    }

    if (!user) {
      return res.render('Login');
    }

    req.login(user, async (err) => {
      if (err) {
        return res.render('Login');
      }

      res.redirect('/Users/login');
    });
  })(req, res, next);
};

module.exports = { userSignUp, userLogin };
