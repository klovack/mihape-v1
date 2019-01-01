const { isEmail, isMobilePhone, isPostalCode } = require('validator');
const { isValidIBAN } = require('ibantools');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { isOldEnough } = require('../helper/validator');
const { sendConfirmationMail, sendResetPasswordMail } = require('../helper/nodemailer');

// Setup mongoose
const mongoose = require('../db/mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: [isOldEnough, 'User must be at least 18 years old'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [isEmail, 'Invalid Email'],
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    validate: [isMobilePhone, 'Invalid Mobile Phone Number'],
  },
  address: {
    country: {
      type: String,
      required: true,
    },
    postcode: {
      type: String,
      required: true,
      validate: {
        validator: function validate(val) {
          return isPostalCode(val, 'any');
        },
        message: props => `${props.value} is not a valid postcode`,
      },
    },
    street: {
      type: String,
      required: true,
    },
    houseNumber: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
  },
  bankAccount: [
    {
      name: {
        type: String,
        required: true,
      },
      accountNumber: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      IBAN: {
        type: String,
        validate: [isValidIBAN, 'Invalid IBAN'],
      },
      otherInformation: [
        {
          name: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
  recipients: [mongoose.Schema.Types.ObjectId],
  transactions: [mongoose.Schema.Types.ObjectId],
  status: {
    type: String,
    required: true,
    default: 'IS_INACTIVE',
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  suspendedAt: Date,
  language: String,
});

/*
  Create User function assumes that newUser is already validated
  and just need to be hashed and saved
*/
userSchema.statics.createUser = function createUser(newUser, callback) {
  const User = this;
  const toBeSaved = new User({
    ...newUser,
  });

  toBeSaved.save(callback);
};

userSchema.statics.findByEmail = function findByEmail(email, callback) {
  const User = this;

  User.findOne({ email }, callback);
};

userSchema.statics.verifyEmailToken = function verifyEmailToken(token, callback) {
  const User = this;

  jwt.verify(token, process.env.EMAIL_SECRET, (err, decoded) => {
    if (err) {
      callback(err);
    } else if (!decoded) {
      callback({ error: 'token is undefined' });
    } else {
      User.findOneAndUpdate({
        _id: decoded.userId,
        status: 'IS_INACTIVE',
      }, { $set: { status: 'IS_ACTIVE' } }, callback);
      // Clear token from the redis database
    }
  });
};

userSchema.statics.verifyToken = function verifyToken(token, callback) {
  // TODO: Check from the redis database if this token exist

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      callback(err);
    } else if (!decoded) {
      callback({ error: 'token is undefined' });
    } else {
      callback(null, decoded);
    }
  });
};

userSchema.statics.addRecipient = function addRecipient(userId, recipientId, callback) {
  const User = this;

  User.findByIdAndUpdate(userId, { $push: { recipients: recipientId } }, callback);
};

userSchema.statics.removeRecipient = function removeRecipient(userId, recipientId, callback) {
  const User = this;

  User.findByIdAndUpdate(userId, { $pull: { recipients: recipientId } }, callback);
};

userSchema.statics.addTransaction = function addTransaction(userId, transactionId, callback) {
  const User = this;

  User.findByIdAndUpdate(userId, { $push: { transactions: transactionId } }, callback);
};

userSchema.methods = {
  hashPassword(password) {
    return bcrypt.hashSync(password, 10);
  },

  validPassword(password) {
    return bcrypt.compareSync(password, this.password);
  },

  /**
   * Generate token with jwt, which contain the user id.
   * The token will expire in 30 min. Used for login
   * @todo Save the generated token in redis database
   *
   * So that it prevents creating multiple tokens in short time
   * @returns token that expires in 30 min
   */
  createToken(useOldToken) {
    // Use old token will search through the redis database and use that instead.
    if (useOldToken) {
      // TODO: Check available token from redis database
      // return token from the redis database
    }

    // If there aren't any, create new one
    // eslint-disable-next-line no-underscore-dangle
    const token = jwt.sign({ userId: this._id }, process.env.JWT_SECRET, { expiresIn: '30m' });

    // TODO: Store token in redis database
    return token;
  },

  /**
   * Same as create token but with shorter expire date
   * @todo Save the generated token in redis database
   *
   * So that it prevents creating multiple tokens in short time
   * @returns {string} token that expires in 1 hour
   */
  createResetPasswordToken() {
    // TODO: Check available token from redis database and then send it back

    // eslint-disable-next-line no-underscore-dangle
    const token = jwt.sign({ email: this.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // TODO: Store token in redis database
    return token;
  },

  // Override mongoose toJSON method (remove password)
  toJSON() {
    return {
      userId: this._id, // eslint-disable-line no-underscore-dangle
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth,
      email: this.email,
      phoneNumber: this.phoneNumber,
      address: this.address,
      bankAccount: this.bankAccount,
      recipients: this.recipients,
      transactions: this.transactions,
      status: this.status,
      createdAt: this.createdAt,
      suspendedAt: this.suspendedAt,
      language: this.language,
    };
  },

  toAuthJSON(useOldToken) {
    return {
      token: this.createToken(useOldToken),
      userId: this._id,  // eslint-disable-line
      email: this.email,
      name: this.firstName,
    };
  },

  isConfirmed() {
    return this.status !== 'IS_INACTIVE';
  },

  isSuspended() {
    return this.status === 'IS_SUSPENDED';
  },

  sendConfirmation(callback) {
    jwt.sign(
      { userId: this._id }, // eslint-disable-line
      process.env.EMAIL_SECRET,
      { expiresIn: '12h' },
      (err, emailToken) => {
        sendConfirmationMail({
          receiverEmail: this.email,
          redirectURL: `${process.env.CONFIRM_URL}/${emailToken}`,
        }, callback(err, { receiver: this.email }));
      },
    );
  },

  sendResetPasswordToken(token, callback) {
    sendResetPasswordMail({
      receiverEmail: this.email,
      redirectURL: `${process.env.RESET_PASSWORD_URL}/${token}`,
    }, callback);
  },
};

userSchema.pre('save', function beforeSave(next) {
  if (this.isModified('password')) {
    this.password = this.hashPassword(this.password);
    return next();
  }

  return next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
