const mongoose = require('mongoose');

// Connection url
const url = process.env.MONGODB_URI || `mongodb://${process.env.MONGODB_USERNAME_LOCAL}:${process.env.MONGODB_PASSWORD_LOCAL}@localhost:27017/transferRatesTest`;

mongoose.Promise = global.Promise;
mongoose.connect(url, {
  useNewUrlParser: true,
  useCreateIndex: true,
})
  .then(() => {
    console.log('Connected to the database'); // eslint-disable-line no-console
  })
  .catch((error) => {
    console.error(error); // eslint-disable-line no-console
    console.log('Database is offline. Interaction with the data is impossible'); // eslint-disable-line no-console
  });

module.exports = mongoose;
