process.env.MONGODB_URI = 'mongodb://mihape-database:Rahasia10mihape@localhost:27017/transferRatesTest';
process.env.MIHAPE_NOREPLY_EMAIL = 'no-reply@mihape.com';
process.env.MIHAPE_NOREPLY_PASS = 'Rahasia10@mrizki';

const mongoose = require('../db/mongoose');
const Transaction = require('../model/transaction');
const User = require('../model/user');
const { sendExpiredTransactionMail } = require('../helper/nodemailer');

function disconnectFromMongoose() {
  mongoose.disconnect((error) => {
    if (error) {
      // eslint-disable-next-line
      console.error('error while disconnecting', err);
    } else {
      // eslint-disable-next-line
      console.log('disconnected from the database');
    }
  });
}

function handleError(err) {
  // eslint-disable-next-line no-console
  console.error('Daemon failed to update transaction', err);
  return disconnectFromMongoose();
}

// eslint-disable-next-line consistent-return
Transaction.cancelExpiredTransaction((err, transactions) => {
  if (err) {
    return handleError(err);
  }
  if (!transactions) {
    return handleError({ message: 'No transactions from the database' });
  }

  for (let i = 0; i < transactions.length; i += 1) {
    const transaction = transactions[i];

    // eslint-disable-next-line no-underscore-dangle
    User.findByTransaction(transaction._id)
      .then((users) => {
        for (let j = 0; j < users.length; j += 1) {
          const user = users[j];

          sendExpiredTransactionMail({
            receiverEmail: user.email,
            receiverName: user.firstName,
            transactionFromCurrency: transaction.fromCurrency,
            // eslint-disable-next-line no-underscore-dangle
            transactionId: transaction._id,
          }, (error, success) => {
            if (error) {
              return handleError(error);
            }
            if (!success) {
              return handleError({ message: 'Cannot send email' });
            }

            return disconnectFromMongoose();
          });
        }
      })
      .catch(() => handleError({ message: 'Error while searching for user' }));
  }
});
