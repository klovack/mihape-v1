const TransactionStatus = Object.freeze({
  IS_RECEIVED: 0,
  IS_CANCELED: 1,
  IS_FAILED: 2,
  IS_COMPLETED: 3,
  IS_PROCESSED: 4,
  SENT_BACK: 5,
});

module.exports = TransactionStatus;
