const User = require('../model/user');

const confirmEmail = (req, res, next) => {
  User.findByEmail(req.body.email, (err, user) => {
    if (err) {
      return res.status(500).json({
        message: 'Error while connecting to the database',
        err,
      });
    }

    if (!user) {
      return res.status(404).json({
        message: 'No user with that email',
      });
    }

    if (!user.isConfirmed()) {
      return res.status(400).json({
        message: 'User is not confirmed',
        user: {
          status: user.status,
          email: user.email,
        },
      });
    }

    return next();
  });
};

module.exports = { confirmEmail };
