const router = require('express').Router();
const bodyParser = require('body-parser');

const { authJWT } = require('../middleware/passport');

// Logger
const processLogger = require('../logger/process.log');

// Model
const Recipient = require('../model/recipient');
const Transaction = require('../model/transaction');
const User = require('../model/user');

// Middlewares
const {
  checkForNewRecipient, checkParamForValidMongoID, validateAll,
} = require('../middleware/sanitizer');

// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
router.use(bodyParser.json());

/*
  Get all recipients that belong to the user
*/
router.get('/', authJWT, (req, res) => {
  const searchQuery = {
    user: req.user.userId,
  };

  Recipient.find(searchQuery)
    .then((data) => {
      if (data && data.length > 0) {
        const sendInfo = {
          message: 'successfully get all the recipients',
          data,
        };
        processLogger.info(sendInfo);
        return res.send(sendInfo);
      }

      const sendError = { message: 'Recipient not found' };
      processLogger.error(sendError);
      return res.status(404).send(sendError);
    })
    .catch((err) => {
      const sendError = {
        message: 'Connection to the database cannot be established',
        err,
      };

      processLogger.error(sendError);
      res.status(500).send(sendError);
    });
});

router.post('/', checkForNewRecipient, validateAll, authJWT, (req, res) => {
  const recipientData = req.body.recipient;
  const newRecipient = new Recipient({
    name: recipientData.name,
    country: recipientData.country,
    bankAccount: recipientData.bankAccount,
    isUserAccount: recipientData.isUserAccount,
    user: req.user.userId,
  });

  newRecipient.save()
    .then((data) => { // eslint-disable-line consistent-return
      if (data) {
        User.addRecipient(data.user, data._id, (err, response) => {  // eslint-disable-line
          if (err) { throw new Error('Cannot connect to database'); }
          if (!response) { throw new Error('User not found'); }

          const sendInfo = {
            message: 'Recipient is created successfully',
            data,
          };

          processLogger.info(sendInfo);
          return res.status(200).send(sendInfo);
        });
      } else {
        const sendError = { message: 'Bad Request' };

        processLogger.error(sendError);
        return res.status(400).send(sendError);
      }
    })
    .catch((err) => {
      const sendError = {
        message: 'Connection to the database cannot be established',
        err,
      };

      processLogger.error(sendError);
      res.status(500).send(sendError);
    });
});

/*
  See if the recipient is in use
  If it does, send error
  otherwise, delete the recipient
  Deletable: IS_FAILED, IS_CANCELED, SENT_BACK
*/
router.delete('/:id', checkParamForValidMongoID, validateAll, authJWT, (req, res) => {
  Transaction.isRecipientDeletable(req.params.id)
    .then((condition) => {
      if (!condition) {
        const sendError = {
          message: `Recipient ${req.params.id} is not allowed to be deleted`,
        };

        processLogger.error(sendError);
        res.status(400).send(sendError);
      } else {
        Recipient.findOneAndRemove({
          _id: req.param.id,
          user: req.user.userId,
        }).then((deleted) => {
          if (deleted) {
            // eslint-disable-next-line no-underscore-dangle
            User.removeRecipient(deleted.user, deleted._id, (err, response) => {
              if (err) { throw new Error(err); }
              if (!response) { throw new Error('User not found'); }

              const sendInfo = {
                message: 'Recipient is deleted successfully',
                deleted,
              };

              processLogger.info(sendInfo);
              res.status(200).json(sendInfo);
            });
          } else {
            const sendError = {
              message: `There are no recipient with id of ${req.params.id}`,
            };

            processLogger.error(sendError);
            res.status(400).json(sendError);
          }
        }).catch((err) => {
          const sendError = {
            message: 'Connection to the database cannot be established',
            err,
          };

          processLogger.error(sendError);
          res.status(500).json(sendError);
        });
      }
    }).catch((err) => {
      const sendError = {
        message: 'Connection to the database cannot be established',
        err,
      };

      processLogger.error(sendError);
      res.status(500).send(sendError);
    });
});

router.get('/:id', checkParamForValidMongoID, validateAll, authJWT, (req, res) => {
  Recipient.find({
    _id: req.params.id,
    user: req.user.userId,
  }).then((result) => {
    if (result && result.length > 0) {
      const sendInfo = {
        message: `Successfully get the Recipient with id of ${req.params.id}`,
        result,
      };

      processLogger.info(sendInfo);
      return res.json(sendInfo);
    }

    const sendError = {
      message: `There are no recipient with id of ${req.params.id}`,
    };

    processLogger.error(sendError);
    return res.status(400).json(sendError);
  }).catch((err) => {
    const sendError = {
      message: 'Connection to the database cannot be established',
      err,
    };

    processLogger.error(sendError);
    res.status(500).send(sendError);
  });
});

module.exports = router;
