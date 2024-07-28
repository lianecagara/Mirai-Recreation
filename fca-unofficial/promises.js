const main = require("./index");
const util = require("util");
module.exports = util.promisify(main);