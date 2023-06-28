
const passport = jest.createMockFromModule('passport');

passport.authenticate = jest.fn((strategy, options, callback) => {
  return (req, res, next) => {
    // Simulate successful authentication
    if (
      strategy === 'local' &&
      req.body.email === 'valid@example.com' &&
      req.body.password === 'validPassword'
    ) {
      return callback(null, { email: 'valid@example.com', password: 'validPassword' });
    }

    // Simulate failed authentication
    return callback(null, false, { message: 'Incorrect email or password.' });
  };
});

passport.use = jest.fn();
passport.serializeUser = jest.fn();
passport.deserializeUser = jest.fn();

module.exports = passport;
