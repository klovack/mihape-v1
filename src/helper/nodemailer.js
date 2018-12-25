const nodemailer = require('nodemailer');

// Gmail fallback
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   secure: true,
//   auth: {
//     type: 'OAuth2',
//     user: process.env.GOOGLE_OAUTH_EMAIL,
//     clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
//     refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
//     accessToken: process.env.GOOGLE_OAUTH_ACCESS_TOKEN,
//   },
// });

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MIHAPE_NOREPLY_EMAIL,
    pass: process.env.MIHAPE_NOREPLY_PASS,
  },
});

const sendConfirmationMail = function sendConfirmationMail({ receiver, redirectURL }, callback) {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiver,
    subject: 'Mihape needs to know you\'re real',
    html: `
    <h3>Confirm your email</h3>
    <p>Click This link to confirm your email <a href="${redirectURL}">here</a>.</p>
    <p>If that doesn't work copy and paste this link to your browser.</p>
    <p><a href="${redirectURL}">${redirectURL}</a></p>
    <p style="margin-top:20px; font-size: 14px; color: #6e6d6d">
      Mihape Transfer still in Aplha Testing, If you find any bugs or inconveniences,
      please report to our <a href="mailto:support@mihape.com">Support Team</a>.
    </p>
    `,
  };

  transporter.sendMail(mailOptions, callback);
};

const toCurrencyString = (amount, base) => amount.toLocaleString(undefined, {
  maximumFractionDigits: 2, minimumFractionDigits: 2, style: 'currency', currency: base,
});

const sendNewTransactionMail = function sendTransactionMail({
  receiver, recipient, transaction,
}, callback) {
  // Calculate total based of the combine it with fee or not
  const total = {
    base: transaction.fromCurrency.base,
    amount: transaction.combineWithFee
      ? transaction.fromCurrency.combineAmount + transaction.fee.amount
      : transaction.fromCurrency.originalAmount + transaction.fee.amount,
  };

  console.log(transaction);
  console.log(total);

  // Adjust the money to fit to be displayed
  const display = {
    total: toCurrencyString(total.amount, total.base),
    fromCurrency: toCurrencyString(transaction.combineWithFee
      ? transaction.fromCurrency.combineAmount : transaction.fromCurrency.originalAmount,
    transaction.fromCurrency.base),
    toCurrency: toCurrencyString(transaction.combineWithFee
      ? transaction.toCurrency.combineAmount : transaction.toCurrency.originalAmount,
    transaction.toCurrency.base),
    fee: toCurrencyString(transaction.fee.amount, transaction.fee.base),
  };

  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiver.email,
    subject: 'You\'ve created new transaction',
    bcc: [
      'muhammadrizki.fikriansyah@mihape.com',
      'vitri.indriyani@mihape.com',
    ],
    html: `
    <h3>New Transaction waiting to be completed</h3>
    <p>Hi ${receiver.firstName}, below are the informations about the transaction you just made.</p>
    <ul style="list-style-decoration: none;">
      <li><b>To:</b> ${recipient.name}</li>
      <li><b>Country:</b> ${recipient.country}</li>
      <li><b>Bank Name:</b> ${recipient.bankAccount.name}</li>
      <li><b>IBAN:</b> ${recipient.bankAccount.IBAN}</li>
      <li><b>BIC:</b> ${recipient.bankAccount.BIC}</li>
      <li><b>Sum:</b> ${display.fromCurrency}</li>
      <li><b>Fee:</b> ${display.fee}</li>
    </ul>
    <h4>Total: ${display.total}</h4>
    <h4>Estimation: ${display.toCurrency}</h4>
    <p>
      Please transfer to our <a href="https://mihape.com/bank-accounts/${transaction.id}">Bank Accounts</a> in 12 hours.
      Make sure you also write the transaction id: <b>${transaction.id}</b> on the transfer details.
    </p>
    <p>
      Don't forget to finish up your transaction by clicking <b>'I've transfered'</b> on transaction details page.
      Otherwise we couldn't process your transaction.
    </p>
    <p>Best regards</p>
    <p style="margin-top:20px; font-size: 14px; color: #6e6d6d">
      Mihape Transfer still in Aplha Testing, If you find any bugs or inconveniences,
      please report to our <a href="mailto:support@mihape.com">Support Team</a>.
    </p>
    `,
  };

  transporter.sendMail(mailOptions, callback);
};

/**
 * Send Confirmation email to mihape team
 * and also to the customer
 */
const sendMoneyTransferedMail = ({ receiver, transaction }, callback) => {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiver.email,
    subject: 'Money is on its way',
    bcc: [
      'support@mihape.com',
      'muhammadrizki.fikriansyah@mihape.com',
      'vitri.indriyani@mihape.com',
    ],
    html: `
    <h3>Your work here is done</h3>
    <p>
      Hello ${receiver.firstName},
    <p>
      The money you just transfered is on its way to us. 
      It depends on the Bank condition when will we receive the money.
    </p>
    <p>
      But don't worry, we will transfer your money to your destination as soon as possible.
      So just relax and thank you for using our service
    </p>
    <p>
      If you have any question, please don't hesitate to contact our
      <a href="mailto:support@mihape.com">Support</a> team.
    </p>
    <p style="margin-top:20px; font-size: 14px; color: #6e6d6d">
      Mihape Transfer still in Aplha Testing, If you find any bugs or inconveniences,
      please report to our <a href="mailto:support@mihape.com">Support Team</a>.
    </p>
    `,
  };

  transporter.sendMail(mailOptions, callback);
};

module.exports = {
  sendConfirmationMail,
  sendNewTransactionMail,
  sendMoneyTransferedMail,
};
