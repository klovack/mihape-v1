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

const sendConfirmationMail = ({ receiverEmail, redirectURL }, callback) => {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiverEmail,
    subject: 'Mihape needs to know you\'re real',
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;font-size:16px;" >
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="600" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;" >
                <td align="center" valign="bottom">
                  <a href="https://www.mihape.com"><img id="logo-mihape" src="./img/logo.png" alt="Logo Mihape" style="width:300px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;line-height:0;" >A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px;line-height:0;" >Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;" >
                <td align="center" valign="top">
                  <h2 style="font-size:28px;" >Konfirmasikan Email Kamu</h2>
                  <p>Klik tombol di bawah ini untuk mengkonfirmasi email.</p>
                  <a href="${redirectURL}">
                    <button class="btn btn-primary" style="padding-top:12px;padding-bottom:12px;padding-right:12px;padding-left:12px;font-family:Arial, Helvetica, sans-serif;border-width:1px;border-style:solid;border-color:#1D253E;background-color:#1D253E;color:#ffffff;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;border-radius:4px;cursor:pointer;" >
                      Konfirmasi Email
                    </button>
                  </a>
                </td>
              </tr>
              <tr id="footer" style="background-color:#1D253E;color:white;height:fit-content;font-size:12px;" >
                <td align="center" valign="bottom">
                  <p>
                    Mihape Transfer masih dalam fase Alpha. Maka dari itu, jika kamu menemukan ketidaknyamanan dalam memakai layanan kami,
                    silahkan hubungi <a href="mailto:support@mihape.com" style="color:#7A9ED4;text-decoration:none;" >Tim Support</a> kami.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
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
      <li><b>BIC:</b> ${recipient.bankAccount.bic}</li>
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
      Mihape Transfer is currently still in Alpha. So, if you find any bugs or inconveniences,
      please report to our <a href="mailto:support@mihape.com">Support Team</a>.
    </p>
    `,
  };

  // transporter.sendMail(mailOptions, callback);
};

/**
 * Send Confirmation email to mihape team
 * and also to the customer
 */
// eslint-disable-next-line no-unused-vars
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

  // transporter.sendMail(mailOptions, callback);
};

/**
 * Send reset password url to the user
 * @param {any} Options with receiverEmail and redirectUrl
 * @param {function} callback callback function when this mail is executed
 */
const sendResetPasswordMail = ({ receiverEmail, redirectURL }, callback) => {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiverEmail,
    subject: 'Mihape sends you reset password url',
    html: `
    <div style="width: 90%; max-width: 1000px;">
      <h3 style="font-size: 24px;">Request to reset password</h3>
      <p>
        Did you forget your password?
      </p>
      <p>
        Someone requested a reset password request today. We just want to make sure that
        it is you. Click this button below to reset it.
      </p>
      <div style="width: fit-content; margin: 0 auto;">
        <a href="${redirectURL}">
          <button style="padding: 10px;border: 1px solid #ddd;background: white;box-shadow: 2px 2px 6px #00000020, 0px 0px 6px #00000005;border-radius: 4px;cursor: pointer;">
            Reset Password
          </button>
        </a>
      </div>
      <p>
        If that doesn't work copy this long url here, and paste it into your browser. The link expires in 1 hour.
      </p>
      <p><a href="${redirectURL}">${redirectURL}</a></p>
      <p style="margin-top: 10px; color: #ee0000;">
        If you don't wish to reset your password or it's not you, just ignore this message and continue login using your old password.
        Be sure to reset your password.
      </p>
      <p style="margin-top:20px; font-size: 12px; color: #6e6d6d">
        Mihape Transfer is currently still in Alpha. So, if you find any bugs or inconveniences,
        please report to our <a href="mailto:support@mihape.com">Support Team</a>.
      </p>
    </div>
    `,
  };

  // transporter.sendMail(mailOptions, callback);
};

module.exports = {
  sendConfirmationMail,
  sendNewTransactionMail,
  sendMoneyTransferedMail,
  sendResetPasswordMail,
};
