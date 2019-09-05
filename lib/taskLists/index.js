/* eslint-disable func-names */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
module.exports = function (os) {
  return require(`./${os}`);
};
