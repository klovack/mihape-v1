const { isEmpty } = require('lodash');

const mongoose = require('../db/mongoose');
const { transformToMongoQuery } = require('../helper/searchQuery');
const { sendNewTransactionMail } = require('../helper/nodemailer');

const transactionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  deadlineAt: {
    type: Date,
    default: new Date().setDate(new Date().getDate() + 1),
  },
  receivedAt: {
    type: Date,
    min: Date.now(),
  },
  canceledAt: {
    type: Date,
    min: Date.now(),
  },
  failedAt: [{
    type: Date,
    min: Date.now(),
  }],
  status: {
    type: String,
    default: 'IS_PROCESSED',
    required: true,
  },
  fromCurrency: {
    base: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  toCurrency: {
    base: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  finalCurrency: {
    base: String,
    amount: Number,
  },
  toBeTransfered: {
    base: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  fee: {
    base: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  fails: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  combineWithFee: {
    type: Boolean,
    required: true,
  },
});

transactionSchema.statics.findByQuery = function findByQuery(query) {
  const Transaction = this;

  // TODO add userId as query parameter to the search in Transaction
  // query.user = req.userId

  // Make search Query
  const searchQuery = transformToMongoQuery(query);

  return Transaction.find(searchQuery, null, {
    sort: {
      // eslint-disable-next-line no-nested-ternary
      createdAt: query.newest ? -1 : 1,
    },
  })
    .then((data) => {
      if (data && !isEmpty(data)) {
        return Promise.resolve(data);
      }

      return Promise.resolve(null);
    })
    .catch((error) => { throw new Error(error); });
};

transactionSchema.statics.isRecipientDeletable = function isRecipientDeletable(recipientId) {
  const Transaction = this;

  return Transaction.find({
    recipient: recipientId,
    $or: [
      { status: 'IS_RECEIVED' },
      { status: 'IS_PROCESSED' },
      { status: 'IS_COMPLETED' },
    ],
  }).then((result) => {
    if (result && result.length > 0) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }).catch((err) => {
    throw new Error({
      message: 'Cannot connect to the database',
      err,
    });
  });
};

transactionSchema.methods = {
  sendNewTransactionEmail(user, recipient, callback) {
    const receiver = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    const transaction = {
      fromCurrency: this.fromCurrency,
      toCurrency: this.toCurrency,
      fee: this.fee,
    };
    sendNewTransactionMail({ receiver, recipient, transaction }, callback);
  },
};

// Setting up the toBeTransfered property to be the total of the fromCurrency and fee
transactionSchema.pre('save', function beforeSave(next) {
  this.toBeTransfered = {
    base: this.fromCurrency.base,
    amount: this.fromCurrency.amount + this.fee.amount,
  };
  return next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
