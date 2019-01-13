process.env.MONGODB_URI = 'mongodb://mihape-data-transfer:Rahasia10mihape@mihape-alpha-shard-00-00-uwofe.mongodb.net:27017,mihape-alpha-shard-00-01-uwofe.mongodb.net:27017,mihape-alpha-shard-00-02-uwofe.mongodb.net:27017/test?ssl=true&replicaSet=Mihape-Alpha-shard-0&authSource=admin&retryWrites=true';

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
