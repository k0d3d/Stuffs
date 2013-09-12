
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema,
  pureautoinc  = require('mongoose-pureautoinc');


/**
 * Orders Schema
 */
var BillSchema = new Schema({
  billID: {type: Number, default: ''},
  dispenseID: {type: String, default: 'Medical Equipment'},
  patientName: String,
  billClass: {type: String},
  billDate: {type: Date, default: Date.now },
  billCost: {type: String}
});

BillSchema.plugin(pureautoinc.plugin, {
  model: 'Bill',
  field: 'billID'
});


mongoose.model('Bill', BillSchema);
