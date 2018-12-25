const router = require('express').Router();
const bodyParser = require('body-parser');

const User = require('../model/user');
const {
  checkForNewUser,
  checkForCredential,
  checkForEmail,
  validateAll,
  checkForConfirmToken,
  checkForQueryEmail,
  checkForResetPassword,
} = require('../middleware/sanitizer');
const { authEmail, authJWT } = require('../middleware/passport');
const { confirmEmail } = require('../middleware/confirmation');
const processLogger = require('../logger/process.log');

// Middlewares

// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
router.use(bodyParser.json());

router.get('/', authJWT, (req, res) => {
  processLogger.info(`Get profile of ${req.user.email}`);
  res.json({
    message: 'Successfully get the profile',
    data: req.user,
  });
});

router.post('/register', checkForNewUser, validateAll, (req, res) => {
  const newUser = req.body.user;

  User.createUser(newUser, (err, savedUser) => {
    if (err) {
      processLogger.error({
        message: 'Cannot save user',
        err,
      });

      return res.status(500).send({
        message: 'Cannot save user',
        err,
      });
    }

    const sendInfo = {
      message: 'Successfully create new user',
      savedUser: savedUser.toJSON(),
    };

    processLogger.info(sendInfo);
    return res.send(sendInfo);
  });
});

/**
 *Confirm the token from the user.
 */
router.get('/confirm/:token', checkForConfirmToken, validateAll, (req, res) => {
  User.verifyEmailToken(req.params.token, (err, response) => {
    if (err) {
      const sendError = {
        message: 'Error connecting to the server',
        err,
      };
      processLogger.error(sendError);
      res.status(500).json(sendError);
    } else if (!response) {
      const sendError = {
        message: 'User already confirmed',
      };
      processLogger.error(sendError);
      res.status(404).json(sendError);
    } else {
      const sendInfo = {
        message: 'User is confirmed',
        user: {
          email: response.email,
          status: 'IS_ACTIVE',
        },
      };
      processLogger.info(sendInfo);
      res.json(sendInfo);
    }
  });
});

/**
  *Send email to the user based of the userId if user's status still IS_INACTIVE
  *If the status is not IS_INACTIVE redirect user to the profile
  *
  *Route is protected and authorized only
  */
router.post('/confirm', checkForEmail, validateAll, (req, res) => {
  processLogger.info(`${req.body.email} requests confirmation`);

  // Check if he's confirmed (status is not IS_INACTIVE)
  User.findByEmail(req.body.email, (err, user) => {
    if (err) {
      const sendError = {
        message: 'Error while connecting to the database',
        err,
      };

      processLogger.error(sendError);
      return res.status(500).json(sendError);
    }

    if (!user) {
      const sendError = {
        message: `Can't find user with ${req.body.email}`,
      };

      processLogger.error(sendError);
      return res.status(404).json(sendError);
    }

    if (user.isConfirmed()) {
      const sendInfo = {
        message: `${user.email} is already confirmed`,
        user: {
          status: user.status,
          email: user.email,
        },
      };
      processLogger.error(sendInfo);
      return res.status(400).json(sendInfo);
    }

    // If he is not then send the email to the user
    //   and send the success message asynchronously
    user.sendConfirmation((error, response) => {
      if (error) {
        processLogger.error({
          message: 'Error while sending the email',
          error,
        });
      } else {
        processLogger.info({
          message: 'Email sent',
          response,
        });
      }
    });

    return res.json({
      message: 'Email sent. Please wait a few moment',
    });
  });
});

router.get('/login', authJWT, (req, res) => {
  processLogger.info(`${req.user.email} is logging in`);
  res.json({
    message: 'Successfully logged in',
  });
});

router.post('/login', checkForCredential, validateAll, authEmail, confirmEmail, (req, res) => {
  processLogger.info(`${req.user.email} is logging in`);
  res.json({
    message: 'Successfully logged in',
    data: req.user.toAuthJSON(),
  });
});

router.get('/logout', authJWT, (req, res) => {
  const { user } = req;
  req.logout();
  const sendInfo = { message: `${user.email} is logged out` };
  processLogger.info(sendInfo);
  res.json(sendInfo);
});

router.get('/is-available', checkForQueryEmail, validateAll, (req, res) => {
  const { email } = req.query;
  processLogger.info(`check ${email} for availability`);
  User.findByEmail(email, (err, user) => {
    if (err) {
      const sendError = {
        message: 'Error while connecting to the database',
        err,
      };

      processLogger.error(sendError);
      return res.status(500).json(sendError);
    }
    if (user) {
      const sendError = {
        message: `User with ${email} is already in the database`,
        isAvailable: false,
      };

      processLogger.error(sendError);
      return res.json(sendError);
    }
    const sendInfo = {
      message: `Can't find user with ${req.body.email}`,
      isAvailable: true,
    };

    processLogger.info(sendInfo);
    return res.json(sendInfo);
  });
});

/**
 * Request forgot password token so user can access reset-password route
 */
router.post('/forgot-password', checkForEmail, validateAll, (req, res) => {
  const { email } = req.body;
  processLogger.info(`${email} request for password reset`);
  // Logout the logged in user. In case they somehow get here.
  req.logout();

  User.findByEmail(email, (err, user) => {
    if (err) {
      const sendError = {
        message: 'Error while connecting to the database',
        err,
      };

      processLogger.error(sendError);
      return res.status(500).json(sendError);
    }
    if (!user) {
      const sendError = {
        message: `User with ${email} is not in the database`,
      };

      processLogger.error(sendError);
      return res.status(404).json(sendError);
    }

    // Create email token for the user.
    const resetPasswordToken = user.createResetPasswordToken();

    // Uncomment this to send email (dev purposes)
    user.sendResetPasswordToken(resetPasswordToken, (error, success) => {
      if (error) {
        const sendError = {
          message: 'Error while connecting to the database',
          error,
        };

        processLogger.error(sendError);
      }
      if (!success) {
        const sendError = {
          message: 'Error while sending the email',
        };
        processLogger.error(sendError);
      } else {
        const info = {
          message: `Reset password url sent to ${email}`,
        };
        processLogger.info(info);
      }
    });

    const sendInfo = {
      message: `Reset password is created and has been sent to ${email}`,
      // resetPasswordToken, // for development purposes
    };

    processLogger.info(sendInfo);
    return res.json(sendInfo);
  });
});

/**
 * Forgot password route, which verify the resetPasswordToken
 * What it will do is just to give permission for the frontend to access reset-password route.
 * @return 500 if internal error, 404 if resetPasswordToken is false, otherwise 200
 */
router.get('/reset-password/:token', checkForConfirmToken, validateAll, (req, res) => {
  req.logout();
  User.verifyToken(req.params.token, (err, response) => {
    if (err) {
      const sendError = {
        message: 'Error connecting to the server',
        err,
      };
      processLogger.error(sendError);
      res.status(500).json(sendError);
    } else if (!response) {
      const sendError = {
        message: 'Token is not valid or has expired',
      };
      processLogger.error(sendError);
      res.status(404).json(sendError);
    } else {
      const sendInfo = {
        message: 'Token is valid',
        user: {
          email: response.email,
        },
      };
      processLogger.info(sendInfo);
      res.json(sendInfo);
    }
  });
});

/**
 * Verify the token first, if token is valid
 * then find the email and update the password
 */
router.post('/reset-password', checkForResetPassword, validateAll, (req, res) => {
  const { password, token } = req.body;
  processLogger.info('resets the password');

  // Log out the logged in user. So they will receive new token
  req.logout();

  User.verifyToken(token, (err, response) => {
    if (err) {
      const sendError = {
        message: 'Error connecting to the server',
        error: err,
      };
      processLogger.error(sendError);
      res.status(500).json(sendError);
    } else if (!response) {
      const sendError = {
        message: 'Token is not valid or has expired',
      };
      processLogger.error(sendError);
      res.status(404).json(sendError);
    } else {
      const { email } = response;
      User.findByEmail(email, (e, user) => {
        if (e) {
          const sendError = {
            message: 'Error while connecting to the database',
            error: e,
          };

          processLogger.error(sendError);
          return res.status(500).json(sendError);
        }

        if (!user) {
          const sendError = {
            message: `Can't find user with ${email}`,
          };

          processLogger.error(sendError);
          return res.status(404).json(sendError);
        }

        // eslint-disable-next-line
        user.password = password;
        return user.save((error, savedUser) => {
          if (error) {
            const sendError = {
              message: 'Error while connecting to the database',
              error,
            };

            processLogger.error(sendError);
            return res.status(500).json(sendError);
          }

          if (!user) {
            const sendError = {
              message: `Can't find user with ${email}`,
            };

            processLogger.error(sendError);
            return res.status(404).json(sendError);
          }

          const sendInfo = {
            message: 'Successfully changed password',
            user: savedUser.toAuthJSON(),
          };

          processLogger.info(sendInfo);
          return res.json(sendInfo);
        });
      });
    }
  });
});

module.exports = router;
