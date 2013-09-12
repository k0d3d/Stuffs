
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema,
  pureautoinc  = require('mongoose-pureautoinc');


var StockCountSchema = new Schema({
  shID: Number,
  item: {type: Schema.ObjectId, ref: 'Item'},
  locationId: {type: Schema.ObjectId, ref: 'Location'},
  locationName: String,
  amount: Number
});

mongoose.model('StockCount', StockCountSchema);
