/*
  Convert string to valid date
  Returns null if the given string is invalid date
*/
const toValidDate = (toConvert) => {
  if (toConvert && typeof toConvert === 'string') {
    let dateString = toConvert.split('%20');
    dateString = dateString.join(' ');

    const dateResult = new Date(dateString);

    if (dateResult.toLocaleString() !== 'Invalid Date') {
      return dateResult;
    }
  }

  return null;
};

const toValidNumber = (toConvert) => {
  if (toConvert && (typeof toConvert === 'string' || typeof toConvert === 'number')) {
    const result = Number.parseFloat(toConvert);

    return !Number.isNaN(result) ? result : null;
  }

  return null;
};

const isOldEnough = (toValidate) => {
  const minAge = 17;
  if (Object.prototype.toString.call(toValidate) === '[object Date]') {
    return (new Date().getFullYear() - toValidate.getFullYear()) >= minAge;
  }

  return false;
};

module.exports = {
  toValidDate,
  toValidNumber,
  isOldEnough,
};
