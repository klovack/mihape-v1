require('./src/config/config');

const express = require('express');
const cors = require('cors');

const Rates = require('./src/model/rates');
const ratesRoutes = require('./src/routes/ratesRoute');
const transactionRoute = require('./src/routes/transactionRoute');
const recipientRoute = require('./src/routes/recipientRoute');
const userRoute = require('./src/routes/userRoute');
const countryRoute = require('./src/routes/countryRoute');
const { passport } = require('./src/middleware/passport');
const requestLogger = require('./src/logger/request.log');

const app = express();
const port = process.env.PORT || 3000;

// Make sure that the rates is up to date when the server starts
Rates.checkForUpdate();

// Middlewares
// Cors Options
// const corsWhitelist = [
//   process.env.FRONTEND_URL_LOCAL,
//   process.env.FRONTEND_URL_DOCKER,
//   process.env.FRONTEND_IP,
//   'http://mihape.com',
//   'http://frontend',
//   'http://frontend:443',
//   'https://frontend',
//   'frontend',
// ];
// const corsOptions = {
//   origin(origin, callback) {
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'PUT', 'POST', 'DELETE'],
//   optionsSuccessStatus: 200,
// };

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  app.use(cors()); // Frontend Dev
}

// Logger
app.use(requestLogger);
app.use(passport.initialize());

app.use('/api/v1/rates', ratesRoutes);
app.use('/api/v1/transactions', transactionRoute);
app.use('/api/v1/recipients', recipientRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/countries', countryRoute);

app.listen(port, () => {
  console.log(`Server is on port ${port}`); // eslint-disable-line
});
