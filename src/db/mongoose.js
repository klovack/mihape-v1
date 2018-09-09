const mongoose = require('mongoose');

// Connection url
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/transferRatesTest';

mongoose.Promise = global.Promise;
mongoose.connect(url, { useNewUrlParser: true }).catch(() => {
  console.log('Database is offline. Interaction with the data is impossible');
});

module.exports = mongoose;
