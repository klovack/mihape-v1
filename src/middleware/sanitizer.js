const {
  body,
  query,
  param,
  validationResult,
} = require('express-validator/check');

const checkForNewRecipient = [
  body('recipient.name', 'name field must be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
  body('recipient.country', 'country field must be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
  body('recipient.bankAccount.name', 'bankAccount.name must be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
  body('recipient.bankAccount.accountNumber', 'bankAccount.accountNumber must be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
  body('recipient.bankAccount.IBAN').trim().escape(),
  body('recipient.bankAccount.BLZ').trim().escape(),
];

const checkForNewTransaction = [
  body('transaction.name', 'name must be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
  body('transaction.description').trim().escape(),
  body('transaction.fromCurrency.base', 'fromCurrency.base should be provided and valid CurrencyType')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isLength({ min: 3, max: 3 }),
  body('transaction.fromCurrency.amount', 'fromCurrency.amount should be provided and valid Number')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isNumeric()
    .toFloat(),
  body('transaction.toCurrency.base', 'toCurrency.base should be provided and valid CurrencyType')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isLength({ min: 3, max: 3 }),
  body('transaction.recipient', 'recipient must be provided and should be valid MongoID Object')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isMongoId(),
  body('transaction.combineWithFee', 'combineWithFee must be provided and should be either true or false')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isBoolean(),
];

const checkForQueryTransaction = [
  query(['newest', 'oldest'], 'newest or oldest should be either true or false')
    .optional()
    .isBoolean()
    .toBoolean(),
  query(['date', 'begin', 'end'], 'date, begin, or end should follow ISO8601')
    .optional()
    .isISO8601()
    .toDate(),
  query(['min', 'max'], 'min or max should be number')
    .optional()
    .isNumeric()
    .toFloat(),
  query([
    'is_canceled',
    'is_failed',
    'is_processed',
    'is_received',
    'is_completed',
    'sent_back',
  ], 'is_canceled, is_failed, is_processed, is_received, is_completed, or sent_back should be either true or false. Last value will be used')
    .optional()
    .isBoolean()
    .toBoolean(),
];

const checkParamForValidMongoID = [
  param('id', 'Parameter should be valid MongoDB ObjectID')
    .exists().not().isEmpty()
    .isMongoId(),
];

const checkForUpdatableTransaction = [
  body(['transaction.name', 'transaction.description'])
    .optional()
    .trim()
    .escape(),
  body('transaction.recipient', 'recipient should be a valid MongoDB ObjectID')
    .optional()
    .isMongoId(),
];

const checkForQueryRates = [
  query('amount', 'amount should be a valid number')
    .optional()
    .trim()
    .escape()
    .toFloat(),
  query(['base', 'destination'], 'base should be valid CurrencyType')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 3, max: 3 }),
  query('include_fee', 'include_fee should be either true or false')
    .optional()
    .trim()
    .escape()
    .isBoolean()
    .toBoolean(),
];

const checkForNewUser = [
  body(['user.firstName', 'user.lastName'], 'user.firstName and user.lastName should be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
  body('user.dateOfBirth', 'user.dateOfBirth should be provided and follow ISO8601')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isISO8601()
    .toDate(),
  body('user.email', 'user.email should be provided or given email is invalid')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isEmail()
    .normalizeEmail(),
  body('user.password', 'user.password should be provided and should have min of 4 and max 25')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isLength({ min: 4, max: 25 })
    .matches(/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9]{4,25}$/),
  body('user.phoneNumber', 'user.phoneNumber should only contain phone number')
    .optional()
    .trim()
    .escape()
    .isMobilePhone(),
  body([
    'user.address.province',
    'user.address.city',
    'user.address.street',
    'user.address.houseNumber',
    'user.address.country',
  ], 'user address must be provided')
    .trim()
    .escape()
    .exists()
    .not()
    .isEmpty(),
  body('user.address.postcode', 'user.address.postcode must be provided and must be valid postcode')
    .trim()
    .escape()
    .exists()
    .not()
    .isEmpty()
    .isPostalCode('any'),
];

const checkForCredential = [
  body('email', 'Email must be provided and valid email')
    .exists().not().isEmpty()
    .trim()
    .escape()
    .isEmail()
    .normalizeEmail(),
  body('password', 'Password must be provided')
    .exists().not().isEmpty()
    .trim()
    .escape(),
];

const checkForEmail = [
  body('email', 'Email must be provided and must be valid')
    .exists().not().isEmpty()
    .isEmail()
    .normalizeEmail(),
];

const checkForConfirmToken = [
  param('token', 'Token in params must be provided')
    .exists().not().isEmpty(),
];

const validateAll = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).send({ errors: errors.array() });
  } else {
    next();
  }
};

module.exports = {
  checkForNewRecipient,
  checkForNewTransaction,
  checkForQueryTransaction,
  checkParamForValidMongoID,
  checkForUpdatableTransaction,
  checkForQueryRates,
  checkForNewUser,
  checkForCredential,
  checkForEmail,
  checkForConfirmToken,
  validateAll,
};
