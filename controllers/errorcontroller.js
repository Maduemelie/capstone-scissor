const AppError = require('../utils/AppError');

const sendError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    stack: err.stack,
    message: err.message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (!(err instanceof AppError)) {
    err = new AppError(err.message, err.statusCode);
  }

  sendError(err, res);
};
