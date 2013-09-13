
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema;


/**
 * Orders Schema
 */
var BillSchema = new Schema({
  dispenseID: {type: Schema.ObjectId, ref: 'Dispense'},
  patientName: String,
  patientId: String,
  billClass: {type: String},
  billedOn: {type: Date, default: Date.now},
  billCost: {type: Number},
  billPrice: {type: Number},
});



mongoose.model('Bill', BillSchema);
