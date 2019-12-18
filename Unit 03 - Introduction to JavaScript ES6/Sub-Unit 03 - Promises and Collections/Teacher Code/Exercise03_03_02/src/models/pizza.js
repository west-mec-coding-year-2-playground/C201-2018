var fluxGen = require('../lib/fluxGen');

function getRand () {
  return +(Math.random() * 100).toFixed(0);
}

class Pizza {
  constructor (startingDate, quotes, ...pizzaProps) {
    this.startingDate = startingDate;
    [
      this.ticker,
      this.name,
      this.startingQuote,
      this.variability = getRand(),
      this.positivity = getRand()
    ] = pizzaProps;
    this.quotes = quotes || [this.startingQuote];
  }

  // private methods
  _addQuote (quote) {
    this.quotes.push(quote);
  }

  _getQuote (quoteIndex) {
    return this.quotes[quoteIndex];
  }

  // public methods
  getNext () {
    var newQuote = fluxGen(this.getLast(), 1, this.variability, this.positivity)[0];
    this._addQuote(newQuote);
    return newQuote;
  }

  getLast () {
    return this._getQuote(this.quotes.length - 1);
  }

  getDatedQuotes () {
    var quotesMap = {},
      { startingDate: curDate } = this;

    this.quotes.forEach(function (quote) {
      quotesMap[curDate] = quote;
      curDate.setDate(curDate.getDate() + 1);
    });

    return quotesMap;
  }
}

Pizza.hydrate = function (pizzaObj) {
  var newPizza = new Pizza(
    pizzaObj.startingDate,
    pizzaObj.quotes,
    pizzaObj.ticker,
    pizzaObj.name,
    pizzaObj.startingQuote,
    pizzaObj.variability,
    pizzaObj.positivity);

  newPizza.quotes = pizzaObj.quotes;
  return newPizza;
};

module.exports = Pizza;
