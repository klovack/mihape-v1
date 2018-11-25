const mongoose = require('mongoose');

// Connection url
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/transferRatesTest';
console.log(url);

mongoose.Promise = global.Promise;
mongoose.connect(url, { useNewUrlParser: true }).catch((error) => {
  console.error(error);
  console.log('Database is offline. Interaction with the data is impossible'); // eslint-disable-line no-console
});

module.exports = mongoose;
