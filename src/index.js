require('./config/config');

const express = require('express');

const Rates = require('./model/rates');
const ratesRoutes = require('./routes/ratesRoute');
const transactionRoute = require('./routes/transactionRoute');
const recipientRoute = require('./routes/recipientRoute');
const userRoute = require('./routes/userRoute');
const { passport } = require('./middleware/passport');
const requestLogger = require('./logger/request.log');

const app = express();
const port = process.env.PORT || 3000;

// Make sure that the rates is up to date when the server starts
Rates.checkForUpdate();

// Middlewares
// Logger
app.use(requestLogger);
app.use(passport.initialize());

app.use('/api/v1/rates', ratesRoutes);
app.use('/api/v1/transactions', transactionRoute);
app.use('/api/v1/recipients', recipientRoute);
app.use('/api/v1/user', userRoute);

app.listen(port, () => {
  console.log(`Server is on port ${port}`); // eslint-disable-line
});
