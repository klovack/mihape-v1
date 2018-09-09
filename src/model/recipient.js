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
  bankAccount: {
    name: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    IBAN: String,
    BLZ: String,
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
