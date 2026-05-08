const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists.' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
