const router = require('express').Router();
const bodyParser = require('body-parser');

const Rates = require('../model/rates');
const Recipient = require('../model/recipient');
const User = require('../model/user');
const Transaction = require('../model/transaction');
const {
  validateAll,
  checkForNewTransaction,
  checkForQueryTransaction,
  checkParamForValidMongoID,
  checkForUpdatableTransaction,
} = require('../middleware/sanitizer');
const objectify = require('../helper/objectify');
const { getSearchQuery } = require('../helper/searchQuery');
const { authJWT } = require('../middleware/passport');
const processLogger = require('../logger/process.log');

// Middlewares

// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
router.use(bodyParser.json());

/*
  Respond with all the transaction that belong to the user
*/
router.get('/', checkForQueryTransaction, validateAll, authJWT, (req, res) => {
  const query = getSearchQuery(req);

  let limit;

  try {
    limit = parseInt(req.query.limit, 10);
  } catch (err) {
    limit = null;
  }

  Transaction.findByQuery(query, limit)
    .then((data) => {
      if (data) {
        const sendInfo = {
          message: 'Get all transaction based on the query',
          data,
          user: req.user.email,
        };
        processLogger.info(sendInfo);
        res.send(sendInfo);
      } else {
        const sendError = {
          message: 'No transaction found',
          user: req.user.email,
        };
        processLogger.error(sendError);
        res.status(404).send(sendError);
      }
    })
    .catch((err) => {
      const sendError = {
        message: 'Connection to the database cannot be established',
        err,
        user: req.user.email,
      };
      processLogger.error(sendError);
      res.status(500).send(sendError);
    });
});

/*
  Create new Transaction and respond with that created transaction
*/
router.post('/', checkForNewTransaction, validateAll, authJWT, (req, res) => {
  const newTransaction = req.body.transaction;

  try {
    processLogger.info({
      message: 'Creating new transaction: Checking base',
      from: `${newTransaction.fromCurrency.amount} ${newTransaction.fromCurrency.base}`,
      to: `${newTransaction.toCurrency.base}`,
    });

    // Validate base currency
    const base = objectify.currencyType(newTransaction.fromCurrency.base);
    // Convert to object to validate
    const destination = objectify.currencyType(newTransaction.toCurrency.base);

    // Convert rates
    Rates.convertRates(
      newTransaction.fromCurrency.amount,
      base,
      destination,
      newTransaction.combineWithFee,
    )
      .then((result) => {
        if (!result) {
          const sendError = {
            message: 'Rates cannot be converted',
          };
          processLogger.error(sendError);
          return res.status(500).send(sendError);
        }

        processLogger.info(`Checking if recipient with the id of ${newTransaction.recipient} exists`);
        return Recipient.exist(newTransaction.recipient, req.user.userId)
          .then(({ condition, recipient }) => {
            if (!condition) {
              const sendError = {
                message: 'Recipient not found',
              };
              processLogger.error(sendError);
              return res.status(400).send(sendError);
            }

            const toBeSaved = new Transaction({
              ...newTransaction,
              fromCurrency: result.fromCurrency,
              toCurrency: result.toCurrency,
              fee: {
                base: result.fromCurrency.base,
                amount: result.fee,
              },
              user: req.user.userId,
              toBeTransfered: {
                base: result.fromCurrency.base, // Amount will be set each saves
                amount: result.combineWithFee
                  ? result.fromCurrency.combineAmount + result.fee
                  : result.fromCurrency.originalAmount + result.fee,
              },
            });

            processLogger.info({
              message: 'Saving new Transaction',
              transaction: toBeSaved,
            });
            return toBeSaved.save()
              .then((data) => {
                if (!data) {
                  const sendError = {
                    message: 'Transaction cannot be created',
                  };
                  processLogger.error(sendError);
                  return res.status(500).send(sendError);
                }

                // eslint-disable-next-line no-underscore-dangle
                return User.addTransaction(data.user, data._id, (err, user) => {
                  if (err) { throw new Error(err); }
                  if (!user) { throw new Error('User not found'); }

                  // Send transaction email to user asynchronously
                  data.sendNewTransactionEmail(user, recipient, (error, response) => {
                    if (error) {
                      processLogger.error({
                        message: 'Email can not be sent',
                        error,
                      });
                    } else {
                      processLogger.info({
                        message: 'Email sent',
                        response,
                      });
                    }
                  });

                  const sendInfo = {
                    message: 'Successfully created new transaction',
                    data,
                  };
                  processLogger.info(sendInfo);
                  return res.send(sendInfo);
                });
              })
              .catch((err) => {
                const sendError = {
                  message: 'Error connecting to the database',
                  err,
                };
                processLogger.error(sendError);
                res.status(500).send(sendError);
              });
          })
          .catch(err => res.status(500).send({
            message: 'Error connecting to the database',
            err,
          }));
      });
  } catch (error) {
    const sendError = {
      message: 'Error connecting to the database',
      error,
    };
    processLogger.error(sendError);
    res.status(400).send(sendError);
  }
});

router.get('/:id', checkParamForValidMongoID, validateAll, authJWT, (req, res) => {
  Transaction.findOne({
    _id: req.params.id,
    user: req.user.userId,
  }).then((result) => {
    if (result) {
      return res.send(result);
    }
    return res.status(404).send({
      message: 'No transaction associates with that id',
    });
  }).catch(err => res.send(500).send({
    message: 'Error connecting to the database',
    err,
  }));
});

/*
  It won't exactly delete the transaction from database.
  It only change the status to IS_CANCELED, but only
  if the status is IS_RECEIVED, IS_PROCESSED, or IS_FAILED
*/
router.delete('/:id', checkParamForValidMongoID, validateAll, authJWT, (req, res) => {
  Transaction.findOneAndUpdate({
    _id: req.params.id,
    user: req.user.userId,
    $or: [
      { status: 'IS_RECEIVED' },
      { status: 'IS_PROCESSED' },
      { status: 'IS_FAILED' },
    ],
  }, {
    $set: {
      status: 'IS_CANCELED',
      canceledAt: Date.now(),
    },
  }).then((oldResult) => {
    if (oldResult) {
      const data = oldResult;
      data.status = 'IS_CANCELED';
      return res.send({
        message: 'Successfully canceled the transaction',
        data,
      });
    }

    return res.status(404).send({
      message: 'No transaction found',
    });
  }).catch(err => res.status(500).send({
    message: 'Error connecting to the database',
    err,
  }));
});

/*
  Update the transaction only if the status IS_PROCESSED or IS_FAILED
*/
router.put('/:id', checkParamForValidMongoID, checkForUpdatableTransaction, validateAll, authJWT, (req, res) => {
  const query = req.body.transaction;

  if (!query) {
    return res.send({
      message: 'Nothing to change',
    });
  }

  const updatedQuery = {};
  if (query.name) {
    updatedQuery.name = query.name;
  }
  if (query.description) {
    updatedQuery.description = query.description;
  }
  if (query.recipient) {
    updatedQuery.recipient = query.recipient;
  }

  return Transaction.findOneAndUpdate({
    _id: req.params.id,
    user: req.user.userId,
    $or: [
      { status: 'IS_PROCESSED' },
      { status: 'IS_FAILED' },
    ],
  }, {
    $set: updatedQuery,
  }).then((oldResult) => {
    if (oldResult) {
      return res.send({
        message: 'successfully update the transaction',
        oldResult,
      });
    }

    return res.status(404).send({
      message: 'No transaction found',
    });
  }).catch(err => res.status(500).send({
    message: 'Error connecting to the database',
    err,
  }));
});

module.exports = router;
