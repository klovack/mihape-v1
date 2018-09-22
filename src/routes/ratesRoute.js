const router = require('express').Router();

const Rates = require('../model/rates');
const objectify = require('../helper/objectify');
const { checkForQueryRates, validateAll } = require('../middleware/sanitizer');

router.get('/', checkForQueryRates, validateAll, (req, res) => {
  const { query } = req;
  const combineWithFee = query.include_fee;

  try {
    let amount;
    let base;
    let destination;

    // Check to see if each query is not undefined
    if (query.amount) {
      ({ amount } = query);
    }

    if (query.base) {
      base = objectify.currencyType(query.base);
    }

    if (query.destination) {
      destination = objectify.currencyType(query.destination);
    }

    // Do convert rates if user want specify the destination
    if (destination) {
      return Rates.convertRates(amount, base, destination, combineWithFee)
        .then(data => res.send({
          message: 'Successfully fetch the data',
          data,
        })).catch(err => res.status(500).send({
          message: 'Unable to fetch the data',
          err,
        }));
    }

    // Otherwise get total rates base of the base and amount that is provided
    return Rates.getTotalRates(amount, base).then(data => res.send({
      message: 'Successfully fetch the data',
      data,
    })).catch(err => res.status(500).send({
      message: 'Unable to fetch the data',
      err,
    }));
  } catch (error) {
    return res.status(500).send({
      message: 'Query is not valid type of CurrencyType',
      error,
    });
  }
});

module.exports = router;
