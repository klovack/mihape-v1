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

/*
  Confirm the token from the user.
*/
router.get('/confirm/:token', checkForConfirmToken, validateAll, (req, res) => {
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

module.exports = router;
