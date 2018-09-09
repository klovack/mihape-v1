const { UserStatus } = require('../model/userStatus');
const CurrencyType = require('../model/currencyType');
const TransactionStatus = require('../model/transactionStatus');

/*
  Convert CurrencType Enum to String so it's readable
*/
const currencyType = (toConvert) => {
  if (toConvert && typeof toConvert === 'number') {
    switch (toConvert) {
      case CurrencyType.EUR:
        return 'EUR';
      case CurrencyType.IDR:
        return 'IDR';
      case CurrencyType.USD:
        return 'USD';
      default:
        return null;
    }
  }
  return null;
  // throw new Error('Argument is not the type of CurrencyType or Number');
};

const transactionStatus = (toConvert) => {
  if (toConvert && typeof toConvert === 'number') {
    switch (toConvert) {
      case TransactionStatus.IS_RECEIVED:
        return 'IS_RECEIVED';
      case TransactionStatus.IS_CANCELED:
        return 'IS_CANCELED';
      case TransactionStatus.IS_FAILED:
        return 'IS_FAILED';
      case TransactionStatus.IS_COMPLETED:
        return 'IS_COMPLETED';
      case TransactionStatus.IS_PROCESSED:
        return 'IS_PROCESSED';
      case TransactionStatus.SENT_BACK:
        return 'SENT_BACK';
      default:
        return null;
    }
  }
  return null;
  // throw new Error('Argument is not the type of TransactionStatus or Number');
};

const userStatus = (toConvert) => {
  if (toConvert && typeof toConvert === 'number') {
    switch (toConvert) {
      case UserStatus.IS_ACTIVE:
        return 'IS_ACTIVE';
      case UserStatus.IS_SUSPENDED:
        return 'IS_SUSPENDED';
      case UserStatus.IS_BLOCKED:
        return 'IS_BLOCKED';
      case UserStatus.IS_INACTIVE:
        return 'IS_INACTIVE';
      default:
        return null;
    }
  }

  return null;
};

module.exports = {
  currencyType,
  transactionStatus,
  userStatus,
};
