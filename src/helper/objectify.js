const CurrencyType = require('../model/currencyType');
const TransactionStatus = require('../model/transactionStatus');
const UserStatus = require('../model/user');

const currencyType = (toConvert) => {
  if (toConvert && typeof toConvert === 'string') {
    switch (toConvert.toUpperCase()) {
      case 'EUR':
        return CurrencyType.EUR;
      case 'IDR':
        return CurrencyType.IDR;
      case 'USD':
        return CurrencyType.USD;
      default:
        throw new Error('Invalid Argument');
    }
  }
  throw new Error('Argument is not the type of String');
};

const transactionStatus = (toConvert) => {
  if (toConvert && typeof toConvert === 'string') {
    switch (toConvert.toUpperCase()) {
      case 'IS_RECEIVED':
        return TransactionStatus.IS_RECEIVED;
      case 'IS_CANCELED':
        return TransactionStatus.IS_CANCELED;
      case 'IS_FAILED':
        return TransactionStatus.IS_FAILED;
      case 'IS_COMPLETED':
        return TransactionStatus.IS_COMPLETED;
      case 'IS_PROCESSED':
        return TransactionStatus.IS_PROCESSED;
      case 'SENT_BACK':
        return TransactionStatus.SENT_BACK;
      default:
        throw new Error('Invalid Argument');
    }
  }

  throw new Error('Argument is not the type of String');
};

const userStatus = (toConvert) => {
  if (toConvert && typeof toConvert === 'string') {
    switch (toConvert.toUpperCase()) {
      case 'IS_ACTIVE':
        return UserStatus.IS_ACTIVE;
      case 'IS_INACTIVE':
        return UserStatus.IS_INACTIVE;
      case 'IS_BLOCKED':
        return UserStatus.IS_BLOCKED;
      case 'IS_SUSPENDED':
        return UserStatus.IS_SUSPENDED;
      default:
        throw new Error('Invalid Argument');
    }
  }

  throw new Error('Argument is not the type of String');
};

module.exports = {
  currencyType,
  transactionStatus,
  userStatus,
};
