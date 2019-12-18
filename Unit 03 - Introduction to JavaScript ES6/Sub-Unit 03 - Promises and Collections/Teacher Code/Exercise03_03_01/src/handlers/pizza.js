var dataStore = require('../lib/dataStore');

module.exports = function (request, reply) {
  const { ticker } = request.params;

  if (!ticker) {
    return reply('No ticker provided');
  }

  dataStore.getPizza(ticker, function (err, pizza) {
    if (err) {
      console.error(err);
      reply(err);
    } else {
      reply(pizza);
    }
  });
};
