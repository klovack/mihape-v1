const randomString = (stringLength = 4) => Math.random().toString(36).substr(2, stringLength);

module.exports = {
  randomString,
};
