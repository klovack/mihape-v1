process.env.MONGODB_URI = 'mongodb://mihape-database:Rahasia10mihape@localhost:27017/transferRatesTest';

const mongoose = require('../db/mongoose');
const Rates = require('../model/rates');

Rates.checkForUpdate()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Rates is successfully updated');
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.error('Daemon failed to update rates');
  })
  .finally(() => {
    mongoose.disconnect((err) => {
      if (err) {
        // eslint-disable-next-line
        console.error('error while disconnecting', err);
      } else {
        // eslint-disable-next-line
        console.log('disconnected from the database');
      }
    });
  });
