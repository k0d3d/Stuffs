
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
env = process.env.NODE_ENV || 'development',
config = require('../../config/config')[env],
Schema = mongoose.Schema;

/**
 * Pharmacy Schema 
 */
var DispenseSchema = new Schema({
  patientName: {type: String},
  patientId: {type: Number},
  company: String,
  locationId: {type: Schema.ObjectId, ref: 'Location'},
  drugs: [{
    itemID: {type: Schema.ObjectId, ref: 'Item'},
    amount: Number,
    status: String
  }],
  issueDate: {type: Date, default: Date.now}
});


mongoose.model('Dispense', DispenseSchema);
