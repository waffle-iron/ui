require('../util/extensions');
var _ = require('lodash');

function parseSignal(message_data) {
  try {

    var telegram_signal_message;;

    if (message_data.signal == 'SMA' || message_data.signal == 'EMA') {

      var trend_sentiment = `${(message_data.trend == -1 ? 'Bearish' : 'Bullish')}`;
      var trend_strength = `${(message_data.trend == -1 ? '🔴' : '🔵').repeat(message_data.strength_value)}${'⚪️'.repeat(message_data.strength_max - message_data.strength_value)}`;

      var price_text;
      var price;
      var currency_symbol;
      if (message_data.coin == 'BTC') {
        currency_symbol = 'USD';
        price = message_data.price_usdt;
        price_change = message_data.price_usdt_change;
      }
      else {
        currency_symbol = 'BTC';
        price = message_data.price_satoshis;
        price_change = message_data.price_satoshis_change;
      }

      price_text = price == undefined ? "" : `Price: ${price} (${price_change * 100}%)`;
      telegram_signal_message = `${message_data.coin}/${currency_symbol}}\n${trend_sentiment} ${trend_strength}\n${message_data.horizon.toSentenceCase()} horizon (Poloniex)\n` + price_text;
    }
  }
  catch (err) {
    console.log(err);
  }

  return telegram_signal_message;
}

function decodeMessage(message_body) {

  var message_data_64 = message_body;
  try {
    var message_data_string = Buffer.from(message_data_64, 'base64').toString();
    return JSON.parse(message_data_string);
  }
  catch (err) {
    console.log(err);
    return;
  }
}


var sorted_messages_cache = [];

function sortedSignalInsertion(newSignal) {
  sorted_messages_cache.splice(_.sortedIndexBy(sorted_messages_cache, newSignal, function (signal) { signal.timestamp }), 0, newSignal);
}

function cleanSortedCache() {
  while (sorted_messages_cache.length > 50)
    sorted_messages_cache.pop();
}

function hasValidTimestamp(messageBody) {

  return messageBody != undefined &&
    messageBody.sent_at != undefined &&
    Date.now() - Date.parse(messageBody.sent_at) < 15 * 6000; // 15 minutes 
}

function isDuplicateMessage(message) {

  cleanSortedCache();

  if (sorted_messages_cache.map(msg => msg.id).indexOf(message.MessageId) < 0) {
    sortedSignalInsertion({ id: message.MessageId, timestamp: Date.now() });
    return false;
  }

  return true;
}

var helper = {
  parse: (message) => parseSignal(message),
  hasValidTimestamp: (message) => hasValidTimestamp(message),
  isDuplicateMessage: (message) => isDuplicateMessage(message),
  sortedSignalInsertion: (signal) => sortedSignalInsertion(signal),
  decodeMessage: (message) => decodeMessage(message)
}

exports.signalHelper = helper;

/*{
    '_state':  <django.db.models.base.ModelState object at 0x10dd3c9e8>,
     'id':  6,
     'created_at':  datetime.datetime(2017,11,9,20,27,13,240960),
     'modified_at':  datetime.datetime(2017,11,9,20,27,13,240989),
     'UI':  0,
     'subscribers_only':  True,
     'text':  '',
     'source':  0,
     'coin':  'DASH',
     'signal':  'SMA',
     'trend':  1,
     'risk':  None,
     'horizon':  0,
     'strength_value':  1,
     'strength_max':  3,
     'price_satoshis':  4685451,
     'price_satoshis_change':  0.0009908535119860589,
     'price_usdt':  None,
     'price_usdt_change':  None,
     'volume_btc':  None,
     'volume_btc_change':  None,
     'volume_usdt':  None,
     'volume_usdt_change':  None,
     'timestamp':  datetime.datetime(2017,11,9,20,2,42,451940),
     'sent_at':  datetime.datetime(1970,1,1,0,0)
  }*/