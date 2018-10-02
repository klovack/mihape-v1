const router = require('express').Router();
const path = require('path');

const countries = require('../model/countries.json');

router.get('/', (req, res) => {
  try {
    return res.json({
      message: 'Successfully get the list of country',
      data: countries,
    });
  } catch (error) {
    return res.status(404).json({
      message: 'No country with that name',
      error,
    });
  }
});

router.get('/:countryName', (req, res) => {
  if (req.params.countryName) {
    try {
      const pathToFile = path.join(__dirname, '../model/countries/', `${req.params.countryName}.json`);
      // eslint-disable-next-line
      const data = require(pathToFile);
      return res.json({
        message: 'Successfully get the list of province',
        data,
      });
    } catch (error) {
      return res.status(404).json({
        message: 'No country with that name',
        error,
      });
    }
  }

  return res.status(404).json({
    message: 'Params must be specified',
  });
});

module.exports = router;
