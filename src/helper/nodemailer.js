const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    type: 'OAuth2',
    user: process.env.GOOGLE_OAUTH_EMAIL,
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    accessToken: process.env.GOOGLE_OAUTH_ACCESS_TOKEN,
  },
});

const sendConfirmationMail = function sendConfirmationMail({ receiver, redirectURL }, callback) {
  const mailOptions = {
    from: 'Vitriz <confirm@vitriz.com>',
    to: receiver,
    subject: 'Confirmation from Vitriz',
    html: `
    <h3>Confirm your email</h3>
    <p>Click This link to confirm your email <a href="${redirectURL}">${redirectURL}</a>.</p>
    <p>If that doesn't work copy and paste the link to your browser.</p>
    `,
  };

  transporter.sendMail(mailOptions, callback);
};

const toCurrencyString = toBeConverted => toBeConverted.amount.toLocaleString(undefined, {
  maximumFractionDigits: 2, minimumFractionDigits: 2, style: 'currency', currency: toBeConverted.base,
});

const sendNewTransactionMail = function sendTransactionMail({
  receiver, recipient, transaction,
}, callback) {
  // Calculate total based of the combine it with fee or not
  const total = {
    base: transaction.fromCurrency.base,
    amount: transaction.combineWithFee
      ? transaction.fromCurrency.amount : transaction.fromCurrency.amount + transaction.fee.amount,
  };

  // Adjust the money to fit to be displayed
  const display = {
    total: toCurrencyString(total),
    fromCurrency: toCurrencyString(transaction.fromCurrency),
    toCurrency: toCurrencyString(transaction.toCurrency),
    fee: toCurrencyString(transaction.fee),
  };

  const mailOptions = {
    from: 'Vitriz <confirm@vitriz.com>',
    to: receiver.email,
    subject: 'You\'ve created new transaction',
    html: `
    <h3>New Transaction waiting to be completed</h3>
    <p>Hi ${receiver.firstName}, below are the informations about the transaction you just made.</p>
    <ul style="list-style-decoration: none;">
      <li><b>To:</b> ${recipient.name}</li>
      <li><b>Country:</b> ${recipient.country}</li>
      <li><b>Bank Name:</b> ${recipient.bankAccount.name}</li>
      <li><b>Account Number:</b> ${recipient.bankAccount.accountNumber}</li>
      <li><b>Sum:</b> ${display.fromCurrency}</li>
      <li><b>Fee:</b> ${display.fee}</li>
    </ul>
    <h4>Total: ${display.total}</h4>
    <h4>Estimation: ${display.toCurrency}</h4>
    <p>Please transfer to (insert bank account) in 24 hours. If not, then the transaction will be canceled</p>
    <p>Please note that we process the transaction, only if you use the registered bank accounts for ${receiver.email}</p>
    <p>Best regards</p>
    <p>
    `,
  };

  transporter.sendMail(mailOptions, callback);
};

module.exports = {
  sendConfirmationMail,
  sendNewTransactionMail,
};
