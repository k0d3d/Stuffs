
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
env = process.env.NODE_ENV || 'development',
config = require('../../config/config')[env],
Schema = mongoose.Schema,
pureautoinc  = require('mongoose-pureautoinc');

/**
 * Pharmacy Schema 
 */
var PharmacySchema = new Schema({
  issueId: {type: Number},
  patientName: {type: String},
  patientNo: {type: Number},
  company: String,
  drugs: [{
    itemID: {type: Schema.ObjectId, ref: 'Item'},
    amount: Number,
    status: String
  }],
  issueDate: {type: Date, default: Date.now}
});

PharmacySchema.plugin(pureautoinc.plugin, {
  model: 'Pharmacy',
  field: 'issueId'
});

mongoose.model('Pharmacy', PharmacySchema);
