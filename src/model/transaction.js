const { isEmpty } = require('lodash');

const mongoose = require('../db/mongoose');
const { transformToMongoQuery } = require('../helper/searchQuery');
const { sendNewTransactionMail, sendMoneyTransferedMail, sendCancelationMail } = require('../helper/nodemailer');

const transactionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: new Date(Date.now()),
    required: true,
  },
  deadlineAt: {
    type: Date,
    default: new Date().setTime(Date.now() + (1000 * 60 * 60 * 12)),
  },
  receivedAt: {
    type: Date,
    min: new Date(Date.now()),
  },
  canceledAt: {
    type: Date,
    min: new Date(Date.now()),
  },
  completedAt: {
    type: Date,
    min: new Date(Date.now()),
  },
  failedAt: [{
    type: Date,
    min: new Date(Date.now()),
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
    originalAmount: {
      type: Number,
      required: true,
    },
    combineAmount: {
      type: Number,
      required: true,
    },
  },
  toCurrency: {
    base: {
      type: String,
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    combineAmount: {
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

transactionSchema.statics.findByQuery = function findByQuery(
  query,
  limit,
) {
  const Transaction = this;

  // Make search Query
  const searchQuery = transformToMongoQuery(query);

  return Transaction.find(searchQuery, null, {
    sort: {
      // eslint-disable-next-line no-nested-ternary
      createdAt: query.newest ? -1 : 1,
    },
  })
    .limit(limit)
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

// eslint-disable-next-line prefer-arrow-callback
transactionSchema.static('cancelExpiredTransaction', function cancelExpiredTransaction(callback) {
  const Transaction = this;
  const criteria = {
    status: 'IS_PROCESSED',
    deadlineAt: { $lte: new Date() },
  };

  Transaction.find(criteria)
    .then((transactions) => {
      if (transactions && transactions.length > 0) {
        Transaction.updateMany(
          criteria,
          {
            status: 'IS_CANCELED',
            canceledAt: new Date(),
          },
          {},
          (err) => {
            callback(err, transactions);
          },
        );
      } else {
        callback({ message: 'No Transaction found' }, null);
      }
    });
});

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
      id: this._id, // eslint-disable-line
      combineWithFee: this.combineWithFee,
    };
    sendNewTransactionMail({ receiver, recipient, transaction }, callback);
  },

  sendMoneyTransferedEmail(user, recipient, transaction, callback) {
    const receiver = {
      firstName: user.firstName,
      email: user.email,
    };

    sendMoneyTransferedMail({
      receiver,
      recipient: {
        name: recipient.name,
        country: recipient.country,
      },
      transaction,
    }, callback);
  },

  sendCancelationEmail(user, recipient, callback) {
    const receiverEmail = user.email;
    const receiverName = user.firstName;
    const recipientName = recipient.name;
    const transactionId = this._id; // eslint-disable-line

    sendCancelationMail({
      receiverName, receiverEmail, recipientName, transactionId,
    }, callback);
  },
};

// Setting up the toBeTransfered property to be the total of the fromCurrency and fee
transactionSchema.pre('save', function beforeSave(next) {
  this.toBeTransfered = {
    base: this.fromCurrency.base,
    amount: this.combineWithFee
      ? this.fromCurrency.combineAmount + this.fee.amount
      : this.fromCurrency.originalAmount + this.fee.amount,
  };
  return next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
