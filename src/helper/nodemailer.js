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
    subject: 'Mihape Perlu Tahu Bahwa Email Kamu Benar',
    attachments: [{
      filename: 'logo.png',
      path: `${__dirname}/emails/img/logo.png`,
      cid: 'logo@mihape.com',
    }],
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;font-size:16px;" >
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="600" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;" >
                <td align="center" valign="bottom">
                <a href="https://www.mihape.com" style="color:#7A9ED4;text-decoration:none;" ><img id="logo-mihape" src="cid:logo@mihape.com" alt="Logo Mihape" style="width:250px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;line-height:1;" >A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px;line-height:0;" >Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;" >
                <td align="center" valign="top">
                  <h2 style="font-size:28px; color: #194E96;" >Konfirmasikan Email Kamu</h2>
                  <p>Klik tombol di bawah ini untuk mengkonfirmasi email.</p>
                  <a href="${redirectURL}" style="padding-top:12px;padding-bottom:12px;padding-right:12px;padding-left:12px;font-family:Arial, Helvetica, sans-serif;border-width:1px;border-style:solid;border-color:#1D253E;background-color:#1D253E;color:#ffffff;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;border-radius:4px;cursor:pointer; text-decoration:none;">
                    Konfirmasi Email
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
    subject: 'Transaksi Baru Telah Berhasil Dibuat',
    bcc: [
      'muhammadrizki.fikriansyah@mihape.com',
      'vitri.indriyani@mihape.com',
    ],
    attachments: [{
      filename: 'logo.png',
      path: `${__dirname}/emails/img/logo.png`,
      cid: 'logo@mihape.com',
    }],
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;color:#242424;font-size:16px;" >
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="60%" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;" >
                <td align="center" valign="bottom">
                  <a href="https://www.mihape.com" style="color:#7A9ED4;text-decoration:none;" ><img id="logo-mihape" src="cid:logo@mihape.com" alt="Logo Mihape" style="width:250px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;line-height:1;" >A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px;line-height:0;" >Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;" >
                <td align="left" valign="top">
                  <h3 style="font-size:24px; color: #194E96;" >Kamu Membuat Transaksi Baru</h3>
                  <p>Hai ${receiver.firstName},</p>
                  <p class="highlight" style="font-size:18px;color:#1d1d1d;" >
                    Kamu baru saja membuat transaksi pengiriman uang ke ${recipient.name} di ${recipient.country}
                    sebesar <strong>${display.fromCurrency}</strong>.
                  </p>
                  <p>Pastikan bahwa data penerima di bawah ini sudah benar:</p>
                  <table class="table-data" style="width:100%;" >
                    <tr class="row-table-data" style="background-color: #efefef;">
                      <td style="line-height:2;" >Nama Bank</td>
                      <td style="line-height:2;" >${recipient.bankAccount.name}</td>
                    </tr>
                    <tr class="row-table-data">
                      <td style="line-height:2;" >IBAN</td>
                      <td style="line-height:2;" >${recipient.bankAccount.IBAN}</td>
                    </tr>
                    <tr class="row-table-data" style="background-color: #efefef;">
                      <td style="line-height:2;" >BIC</td>
                      <td style="line-height:2;" >${recipient.bankAccount.bic}</td>
                    </tr>
                  </table>
                  <p>
                    Jika terjadi kesalahan pada data di atas, silahkan hubungi kami
                    <a href="mailto:support@mihape.com?subject=Kesalahan Pada Penerima&body=Data Penerima yang baru adalah:" style="color:#7A9ED4;text-decoration:none;" >disini</a>.
                    Kamu juga bisa lihat <a href="https://www.mihape.com/faq" style="color:#7A9ED4;text-decoration:none;" >FAQ</a> kami untuk melakukan pembatalan
                    transaksi.
                  </p>
                  <p>Penerima akan menerima uang sebesar <strong>${display.toCurrency}</strong>. <span class="warning">Jumlah
                      tersebut hanya perkiraan. Nilai tukar sebenarnya akan dihitung ulang saat transfer telah dilakukan.</span></p>
                  <p class="center small" style="text-align:center;line-height:.3;font-size:14px;" >Biaya + Mengirim = Total</p>
                  <h4 class="center" style="font-size:20px;text-align:center;" >${display.fee} + ${display.fromCurrency} = ${display.total}</h4>
                  <h5 class="center" style="font-size:18px;text-align:center;" >Perkiraan: ${display.toCurrency}</h5>
                  <p>
                    Silahkan kunjungi <a href="https://www.mihape.com/bank-accounts/${transaction.id}" style="color:#7A9ED4;text-decoration:none;" >halaman Bank kami</a>
                    untuk melihat kemana kamu harus transfer lalu ikuti langkah-langkah yang diperlukan agar proses
                    transaksi berjalan lancar.
                  </p>
                  <h5 class="center" style="font-size:18px;text-align:center; color: #b31315" >
                    Jangan lupa cantumkan ID transaksi kamu (${transaction.id}) saat melakukan transfer.
                    Pastikan juga kamu klik tombol <q>Saya Sudah Transfer</q> di <a href="https://www.mihape.com/overview/transactions/${transaction.id}" style="color:#7A9ED4;text-decoration:none;" >halaman
                      detail transaksi</a> agar transaksi dapat segera kami proses.
                  </h5>
                  <p>Salam</p>
                  <p>Mihape Global Nusantara</p>
                </td>
              </tr>
              <tr id="footer" style="background-color:#1D253E;color:white;height:fit-content;font-size:12px;" >
                <td align="center" valign="bottom">
                  <p>
                    Mihape Transfer masih dalam fase Alpha. Maka dari itu, jika kamu menemukan ketidaknyamanan dalam
                    memakai layanan kami,
                    silahkan hubungi <a href="mailto:support@mihape.com" style="color:#7A9ED4;text-decoration:none;" >Tim
                      Support</a> kami.
                  </p>
                  <p>
                    Copyright &#169; Mihape Global Nusantara. All rights reserved.
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

/**
 * Send Confirmation email to mihape team
 * and also to the customer
 */
// eslint-disable-next-line no-unused-vars
const sendMoneyTransferedMail = ({ receiver, transaction, recipient }, callback) => {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiver.email,
    subject: 'Transaksi Sedang Diproses',
    bcc: [
      'support@mihape.com',
      'muhammadrizki.fikriansyah@mihape.com',
      'vitri.indriyani@mihape.com',
    ],
    attachments: [{
      filename: 'logo.png',
      path: `${__dirname}/emails/img/logo.png`,
      cid: 'logo@mihape.com',
    }],
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;color:#242424;font-size:16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="60%" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;">
                <td align="center" valign="bottom">
                <a href="https://www.mihape.com" style="color:#7A9ED4;text-decoration:none;" ><img id="logo-mihape" src="cid:logo@mihape.com" alt="Logo Mihape" style="width:250px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;line-height:1;">A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px;line-height:0;">Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;">
                <td align="left" valign="top">
                  <h3 style="font-size:24px; color: #194E96;">Transaksimu Sedang Kami Proses</h3>
                  <p>
                    Hai ${receiver.firstName},
                    <p>
                      Uang yang kamu transfer sedang kami proses.
                      Apabila semua berjalan lancar, uangmu akan diterima oleh ${recipient.name} di ${recipient.country} paling lambat 2-3 hari kerja tergantung
                      dengan peraturan Bank di negara tujuan.
                    </p>
                    <p>
                      Kamu akan menerima email pemberitahuan selanjutnya apabila transaksimu telah berhasil.
                      Kamu juga bisa melihat status transaksimu di akun Mihape Transfer kamu.
                    </p>
                    <p><a href="https://www.mihape.com/overview/transactions/${transaction.id}" style="color:#7A9ED4;text-decoration:none;">Lihat
                        status transaksi</a></p>
                    <p>
                      Salam
                    </p>
                    <p>Mihape Global Nusantara</p>
                </td>
              </tr>
              <tr id="footer" style="background-color:#1D253E;color:white;height:fit-content;font-size:12px;">
                <td align="center" valign="bottom">
                  <p>
                    Mihape Transfer masih dalam fase Alpha. Maka dari itu, jika kamu menemukan ketidaknyamanan dalam
                    memakai layanan kami,
                    silahkan hubungi <a href="mailto:support@mihape.com" style="color:#7A9ED4;text-decoration:none;">Tim
                      Support</a> kami.
                  </p>
                  <p>
                    Copyright &#169; Mihape Global Nusantara. All rights reserved.
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

/**
 * Send reset password url to the user
 * @param {any} Options with receiverEmail and redirectUrl
 * @param {function} callback callback function when this mail is executed
 */
const sendResetPasswordMail = ({ receiverEmail, redirectURL }, callback) => {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiverEmail,
    subject: 'Mihape Mengirim Kamu Tautan untuk Membuat Kata Sandi Baru',
    attachments: [{
      filename: 'logo.png',
      path: `${__dirname}/emails/img/logo.png`,
      cid: 'logo@mihape.com',
    }],
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;color:#242424;font-size:16px;" >
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="60%" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;" >
                <td align="center" valign="bottom">
                  <a href="https://www.mihape.com" style="color:#7A9ED4;text-decoration:none;" ><img id="logo-mihape" src="cid:logo@mihape.com" alt="Logo Mihape" style="width:250px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;line-height:1;" >A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px;line-height:0;" >Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;" >
                <td align="left" valign="top">
                  <h3 style="font-size:24px; color: #194E96;" >Permintaan Untuk Membuat Kata Sandi Baru</h3>
                  <p>
                    Apakah kamu lupa kata sandimu?
                  </p>
                  <p>
                    Seseorang meminta untuk membuat kata sandi baru. Kita hanya ingin memastikan
                    bahwa itu kamu. Klik tombol di bawah ini untuk membuat kata sandi baru.
                  </p>
                  <div style="width:fit-content;margin-top:0;margin-bottom:0;margin-right:auto;margin-left:auto;" >
                    <a href="${redirectURL}" style="padding-top:12px;padding-bottom:12px;padding-right:12px;padding-left:12px;font-family:Arial, Helvetica, sans-serif;border-width:1px;border-style:solid;border-color:#1D253E;background-color:#1D253E;color:#ffffff;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;border-radius:4px;cursor:pointer; text-decoration:none;">
                      Buat Kata Sandi Baru
                    </a>
                  </div>
                  <p class="warn" style="color:#b31315;" >
                    Apabila kamu tidak membuat permohonan ini, abaikan pesannya atau
                    gunakan kesempatan ini untuk mengubah kata sandimu.
                  </p>
                </td>
              </tr>
              <tr id="footer" style="background-color:#1D253E;color:white;height:fit-content;font-size:12px;" >
                <td align="center" valign="bottom">
                  <p>
                    Mihape Transfer masih dalam fase Alpha. Maka dari itu, jika kamu menemukan ketidaknyamanan dalam
                    memakai layanan kami,
                    silahkan hubungi <a href="mailto:support@mihape.com" style="color:#7A9ED4;text-decoration:none;" >Tim
                      Support</a> kami.
                  </p>
                  <p>
                    Copyright &#169; Mihape Global Nusantara. All rights reserved.
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

const sendCancelationMail = function sendCancelationMail(
  {
    receiverName,
    receiverEmail,
    recipientName,
    transactionId,
  },
  callback,
) {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiverEmail,
    subject: 'Pembatalan Transaksi',
    attachments: [{
      filename: 'logo.png',
      path: `${__dirname}/emails/img/logo.png`,
      cid: 'logo@mihape.com',
    }],
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;color:#242424;font-size:16px;" >
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="60%" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;" >
                <td align="center" valign="bottom">
                  <a href="https://www.mihape.com" style="color:#7A9ED4;text-decoration:none;" ><img id="logo-mihape" src="cid:logo@mihape.com" alt="Logo Mihape" style="width:250px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;line-height:1;" >A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px;line-height:0;" >Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;" >
                <td align="left" valign="top">
                  <h3 style="font-size:24px; color: #194E96;" >Pembatalan Transaksi</h3>
                  <p>
                    Hai ${receiverName}
                  </p>
                  <p>
                    Kami sedih melihatmu membatalkan transaksi ke ${recipientName}.
                    Kami harap kamu dapat segera memakai layanan kami kembali.
                    Apabila kamu sudah melakukan transfer silahkan hubungi
                    <a href="mailto:support@mihape.com?subject=Pengembalian Uang Karena Pembatalan (ID Transaksi: ${transactionId})" style="color:#7A9ED4;text-decoration:none;" >Tim
                      Support kami</a> perihal nomor rekening Bank Indonesia untuk tujuan pengembalian uang.
                  </p>

                  <p class="warn" style="color:#b31315;" >
                    Pengembalian uang tidak termasuk biaya transaksi. Untuk informasi lebih lanjut, kunjungi <a href="https://www.mihape.com/faq" style="color:#7A9ED4;text-decoration:none;" >halaman
                      bantuan kami</a>.
                  </p>
                  <p>Salam</p>
                  <p>Mihape Global Nusantara</p>
                </td>
              </tr>
              <tr id="footer" style="background-color:#1D253E;color:white;height:fit-content;font-size:12px;" >
                <td align="center" valign="bottom">
                  <p>
                    Mihape Transfer masih dalam fase Alpha. Maka dari itu, jika kamu menemukan ketidaknyamanan dalam
                    memakai layanan kami,
                    silahkan hubungi <a href="mailto:support@mihape.com" style="color:#7A9ED4;text-decoration:none;" >Tim
                      Support</a> kami.
                  </p>
                  <p>
                    Copyright &#169; Mihape Global Nusantara. All rights reserved.
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

const sendExpiredTransactionMail = function sendExpiredTransactionMail({
  receiverEmail,
  receiverName,
  transactionId,
}, callback) {
  const mailOptions = {
    from: 'Mihape Notification <no-reply@mihape.com>',
    to: receiverEmail,
    subject: 'Transaksi Dibatalkan',
    attachments: [{
      filename: 'logo.png',
      path: `${__dirname}/emails/img/logo.png`,
      cid: 'logo@mihape.com',
    }],
    html: `
    <div style="font-family:Arial, Helvetica, sans-serif;background-color:#ddd;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;color:#242424;font-size:16px;" >
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="20" cellspacing="0" width="60%" id="emailContainer">
              <tr id="header" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;" >
                <td align="center" valign="bottom">
                  <a href="https://www.mihape.com" style="color:#7A9ED4;text-decoration:none;" ><img id="logo-mihape" src="cid:logo@mihape.com" alt="Logo Mihape" style="width:250px;display:block;" ></a>
                  <h4 class="title" style="font-size:18px;" >A Better Way To Send Money Abroad</h4>
                  <p class="subtitle" style="font-size:12px; line-height: 0" >Anytime, Anywhere</p>
                </td>
              </tr>
              <tr id="body" style="background-color:white;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:250px;" >
                <td align="left" valign="top">
                  <h3 style="font-size:24px;" >Transaksi Dibatalkan</h3>
                  <p>
                    Hai ${receiverName}
                  </p>
                  <p>
                    Kami lihat kamu tidak melakukan transfer dalam batas waktu yang ditentukan.
                    Sayang sekali transaksi yang kamu buat harus kami batalkan.
                    Apabila kamu sudah melakukan transfer namun belum menekan tombol <q>Saya Sudah Transfer</q>, silahkan
                    hubungi
                    <a href="mailto:support@mihape.com?subject=Pengembalian Uang Karena Pembatalan (ID Transaksi: ${transactionId})&body=Rekening Bank dan Kontak yang bisa dihubungi" style="color:#7A9ED4;text-decoration:none;" >Tim
                      Support kami</a>
                    supaya transaksi bisa diproses.
                  </p>

                  <p>Salam</p>
                  <p>Mihape Global Nusantara</p>
                </td>
              </tr>
              <tr id="footer" style="background-color:#1D253E;color:white;height:fit-content;font-size:12px;" >
                <td align="center" valign="bottom">
                  <p>
                    Mihape Transfer masih dalam fase Alpha. Maka dari itu, jika kamu menemukan ketidaknyamanan dalam
                    memakai layanan kami,
                    silahkan hubungi <a href="mailto:support@mihape.com" style="color:#7A9ED4;text-decoration:none;" >Tim
                      Support</a> kami.
                  </p>
                  <p>
                    Copyright &#169; Mihape Global Nusantara. All rights reserved.
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

  callback(null, 'success');

  transporter.sendMail(mailOptions, callback);
};

module.exports = {
  sendConfirmationMail,
  sendNewTransactionMail,
  sendMoneyTransferedMail,
  sendResetPasswordMail,
  sendCancelationMail,
  sendExpiredTransactionMail,
};
