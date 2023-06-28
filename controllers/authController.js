const User = require("../model/userModel");
const passport = require("passport");
const path = require('path')

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

    req.login(newUser, (error) => {
      if (error) {
        const signupPage = path.join(__dirname, '..', 'public', 'html', 'Register.html');
      res.sendFile(signupPage);
      }

      const homePage = path.join(__dirname, '..', 'public', 'html', 'Home.html');
      res.sendFile(homePage);
    });
  } catch (error) {
    const signupPage = path.join(__dirname, '..', 'public', 'html', 'Register.html');
    res.sendFile(signupPage);
  }
};

const userLogin = (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (err) {
          const filePath = path.join(__dirname, "..", "public", "html", "Login.html");
          console.log(user)
        return res.sendFile(filePath);
      }
      
      if (!user) {
          const filePath = path.join(__dirname, "..", "public", "html", "Login.html");
          // console.log("second")
        return res.sendFile(filePath);
      }
      
      req.login(user, (err) => {
        if (err) {
            const filePath = path.join(__dirname, "..", "public", "html", "Login.html");
            // console.log("third")
          return res.sendFile(filePath);
        }
        
        const filePath = path.join(__dirname, "..", "public", "html", "Home.html");
        res.sendFile(filePath);
      });
    })(req, res, next);
  };
module.exports = { userSignUp, userLogin };
