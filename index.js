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
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

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
