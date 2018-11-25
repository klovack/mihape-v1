const axios = require('axios');

const mongoose = require('../db/mongoose');
const stringify = require('../helper/stringify');
const CurrencyType = require('./currencyType');
const processLogger = require('../logger/process.log');

const feePercentage = 0.6;
const profitPercentage = 0.008;
const IDRForeignTransactionFee = 25000;
// Wait time before updating exchange rates
const refreshTime = 6 * 60 * 60 * 1000;
// Waiting time before reset the CheckForUpdate in ms
const timeout = 5000; // 5s
let tryout = 0;
const maxTryout = 3;

const providers = [
  {
    name: 'Fixer',
    urlFromEur: `http://data.fixer.io/api/latest?access_key=${process.env.ACCESS_KEY_API_FIXER}&base=EUR`,
    // urlFromIdr: `http://data.fixer.io/api/latest?access_key=${process.env.ACCESS_KEY_API_FIXER}&base=IDR`,
  },
  {
    name: 'Exchange Rate',
    urlFromEur: `https://v3.exchangerate-api.com/bulk/${process.env.ACCESS_KEY_API_EXCHANGE_RATE}/EUR`,
    // urlFromIdr: `https://v3.exchangerate-api.com/bulk/${process.env.ACCESS_KEY_API_EXCHANGE_RATE}/IDR`,
  },
];

const ratesSchema = new mongoose.Schema({
  base: {
    type: String,
    required: true,
  },
  rates: {
    EUR: Number,
    IDR: Number,
    USD: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

ratesSchema.statics.calculateRates = async function calculateRates() {
  const Rates = this;

  let numCall = 0;
  let successCall = 0;
  const avgRates = {
    base: 'EUR',
    rates: {},
  };

  providers.forEach((provider) => {
    numCall += 1;

    axios.get(provider.urlFromEur)
      .then((respond) => {  // eslint-disable-line
        numCall -= 1;
        successCall += 1;

        // Check to see if avgRate.rates[key] has value
        // If it is, add it with the new respond
        // Otherwise set the value to the respond
        Object.keys(respond.data.rates).forEach((key) => {
          avgRates.rates[key] = avgRates.rates[key]
            ? avgRates.rates[key] + respond.data.rates[key] : respond.data.rates[key];
        });

        if (numCall === 0) {
          // Calculate each symbol
          Object.keys(avgRates.rates).forEach((key) => {
            avgRates.rates[key] /= successCall;
            // avgRates.rates[key] -= (avgRates.rates[key] * profitPercentage);
          });

          // Create new rates
          const newRates = new Rates({
            base: avgRates.base,
            rates: {
              EUR: avgRates.rates.EUR,
              IDR: avgRates.rates.IDR,
              USD: avgRates.rates.USD,
            },
          });

          return newRates.save()
            .then(data => Promise.resolve(data))
            .catch(err => Promise.reject(err));
        }
      }).catch((err) => {
        numCall -= 1;
        return Promise.reject(err);
      });
  });
};

ratesSchema.statics.checkForUpdate = async function checkForUpdate() {
  const Rates = this;

  const today = new Date();
  console.log(today);
  return Rates.find({
    createdAt: {
      $gte: new Date(today.getTime() - refreshTime),
      $lte: today,
    },
  }).then(async (result) => { // eslint-disable-line consistent-return
    if (result && result.length > 0) {
      processLogger.info({
        message: 'Rates is up to date',
        result,
      });
      tryout = 0;
      return result;
    }
    processLogger.info({
      message: 'Calculating Rates',
    });
    Rates.calculateRates().then(() => {
      if (tryout < maxTryout) {
        tryout += 1;

        setTimeout(() => {
          this.checkForUpdate();
        }, timeout);
      } else {
        Promise.reject(new Error('Can\'t fetch the rates. No Internet Connection'));
      }
    }).catch((err) => {
      processLogger.error({
        message: 'Cannot fetch the rates',
        err,
      });
    });
  }).catch((err) => {
    processLogger.error({
      message: 'Cannot fetch the rates',
      err,
    });
    return err;
  });
};

ratesSchema.statics.getUpdatedRates = async function getUpdatedRates() {
  const Rates = this;

  const today = new Date();
  const result = await Rates.find({
    createdAt: {
      $gte: new Date().setHours(today.getHours() - 12),
      $lte: today,
    },
  });

  if (result && result.length > 0) {
    return result[0];
  }

  const newRates = await Rates.checkForUpdate();
  return newRates;
};

ratesSchema.statics.calculateFee = function calculateFee(
  amount = 1,
  base = CurrencyType.EUR,
  exchangeRate,
) {
  if (typeof amount !== 'number') {
    throw new Error('Amount is invalid type');
  }
  if (typeof base !== typeof CurrencyType.TYPE || base > CurrencyType.TYPE || base < 0) {
    throw new Error('Base is invalid type');
  }

  if (exchangeRate) {
    switch (base) {
      case CurrencyType.EUR:
        return 2 + (feePercentage / 100 * amount);
      case CurrencyType.IDR:
        return (3 * exchangeRate.rates.IDR)
        + (feePercentage / 100 * amount) + IDRForeignTransactionFee;
      case CurrencyType.USD:
        return (2.5 * exchangeRate.rates.USD) + (feePercentage / 100 * amount);
      default:
        return 2;
    }
  }

  return null;
};

ratesSchema.statics.getTotalRates = async function getTotalRates(
  amount = 1, base = CurrencyType.EUR, combineWithFee = false,
) {
  const Rates = this;

  if (typeof amount !== 'number') {
    throw new Error('Amount is invalid type');
  }
  if (typeof base !== typeof CurrencyType.TYPE || base > CurrencyType.TYPE || base < 0) {
    throw new Error('Base is invalid type');
  }

  const exchangeRate = await Rates.getUpdatedRates();
  const fee = await Rates.calculateFee(amount, base, exchangeRate);

  const originalAmount = amount;
  const combineAmount = amount - fee;

  switch (base) {
    case CurrencyType.EUR:
      return Promise.resolve({
        combineAmount: {
          EUR: combineAmount,
          IDR: combineAmount * exchangeRate.rates.IDR,
          USD: combineAmount * exchangeRate.rates.USD,
        },
        originalAmount: {
          EUR: originalAmount,
          IDR: originalAmount * exchangeRate.rates.IDR,
          USD: originalAmount * exchangeRate.rates.USD,
        },
        base: 'EUR',
        original: originalAmount,
        combine: combineAmount,
        createdAt: exchangeRate.createdAt,
        fee,
      });
    case CurrencyType.IDR:
      return Promise.resolve({
        combineAmount: {
          EUR: combineAmount / exchangeRate.rates.IDR,
          USD: (combineAmount / exchangeRate.rates.IDR) * exchangeRate.rates.USD,
          IDR: combineAmount,
        },
        originalAmount: {
          EUR: originalAmount / exchangeRate.rates.IDR,
          USD: (originalAmount / exchangeRate.rates.IDR) * exchangeRate.rates.USD,
          IDR: originalAmount,
        },
        base: 'IDR',
        original: originalAmount,
        combine: combineAmount,
        createdAt: exchangeRate.createdAt,
        fee,
      });
    case CurrencyType.USD:
      return Promise.resolve({
        combineAmount: {
          EUR: combineAmount / exchangeRate.rates.USD,
          USD: combineAmount,
          IDR: (combineAmount / exchangeRate.rates.USD) * exchangeRate.rates.IDR,
        },
        originalAmount: {
          EUR: originalAmount / exchangeRate.rates.USD,
          USD: originalAmount,
          IDR: (originalAmount / exchangeRate.rates.USD) * exchangeRate.rates.IDR,
        },
        base: 'USD',
        original: originalAmount,
        combine: combineAmount,
        createdAt: exchangeRate.createdAt,
        fee,
      });
    default:
      return Promise.reject(new Error('Wrong argument'));
  }
};

ratesSchema.statics.convertRates = async function convertRates(
  amount = 1, base = CurrencyType.EUR, destination = CurrencyType.IDR, combineWithFee = false,
) {
  const Rates = this;

  return Rates.getTotalRates(amount, base, combineWithFee)
    .then((data) => {
      const result = {
        fromCurrency: {
          base: stringify.currencyType(base),
          originalAmount: data.original,
          combineAmount: data.combine,
        },
        toCurrency: {
          base: stringify.currencyType(destination),
        },
        createdAt: data.createdAt,
        fee: data.fee,
        total: combineWithFee ? data.combine + data.fee : data.original + data.fee,
        combineWithFee,
      };

      Object.keys(data.combineAmount).forEach((key) => {
        if (key.toString() === stringify.currencyType(destination)) {
          result.toCurrency.combineAmount = data.combineAmount[key]
          - (data.combineAmount[key] * profitPercentage);
        }
      });

      Object.keys(data.originalAmount).forEach((key) => {
        if (key.toString() === stringify.currencyType(destination)) {
          result.toCurrency.originalAmount = data.originalAmount[key]
          - (data.originalAmount[key] * profitPercentage);
        }
      });

      return Promise.resolve(result);
    })
    .catch(err => Promise.reject(err));
};

const Rates = mongoose.model('Rates', ratesSchema);

module.exports = Rates;
