
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
env = process.env.NODE_ENV || 'development',
config = require('../../config/config')[env],
_ = require("underscore"),
Schema = mongoose.Schema;

/**
 * Pharmacy Schema 
 */
var DispenseSchema = new Schema({
  patientName: {type: String},
  patientId: {type: Number},
  class: {type: Schema.ObjectId},
  locationId: {type: Schema.ObjectId, ref: 'Location'},
  drugs: [{
    itemId: {type: Schema.ObjectId, ref: 'Item'},
    itemName: {type: String},
    amount: {type: Number},
    status: {type: String},
    dosage: {type: String},
    period: {type: Number},
    cost: {type: Number}
  }],
  doctorId: String,
  doctorName: String,
  issueDate: {type: Date, default: Date.now},
  dispenseDate: {type: Date},
  status: {type: String, default: 'pending'},
  timerId: {type: String}
});



mongoose.model('Dispense', DispenseSchema);
