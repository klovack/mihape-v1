const { isValidIBAN } = require('ibantools');

const mongoose = require('../db/mongoose');

const recipientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  bankAccount: {
    name: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
    },
    bankCode: {
      type: String,
    },
    IBAN: {
      type: String,
      validate: [isValidIBAN, 'Invalid IBAN'],
      required: true,
    },
    bic: {
      type: String,
      required: true,
    },
    otherInformation: [
      {
        name: {
          type: String,
        },
        value: {
          type: String,
        },
      },
    ],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

recipientSchema.statics.exist = function exist(recipientId, userId) {
  const Recipient = this;

  return Recipient.find({
    user: userId,
    _id: recipientId,
  }).then((result) => {
    if (result && result.length > 0) {
      return Promise.resolve({
        condition: true,
        recipient: result[0],
      });
    }

    return Promise.resolve({ condition: false });
  }).catch((err) => {
    throw new Error(err);
  });
};

const Recipient = mongoose.model('Recipient', recipientSchema);

module.exports = Recipient;
