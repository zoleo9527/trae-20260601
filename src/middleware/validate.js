function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      req.validatedBody = result;
      next();
    } catch (err) {
      res.status(400).json({
        error: 'Validation Error',
        message: err.errors.map(e => e.message).join(', '),
        details: err.errors,
      });
    }
  };
}

module.exports = validate;
