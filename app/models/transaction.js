
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema,
  pureautoinc  = require('mongoose-pureautoinc');

/**
 * [TransactionSchema description]
 * @type {Schema}
 */
var TransactionSchema = new Schema({
	origin: {type: Schema.ObjectId, ref: 'Location'},
	destination: {type: Schema.ObjectId, ref: 'Location'},
	item: {type: Schema.ObjectId, ref: 'Item'},
	amount: {type: Number},
	recordId: {type: String},
	status: {type: String},
	started: {type: Date, default: Date.now},
	stage:[],
	updated: {type: Date},
	operation: {type: String},
});

mongoose.model('transaction', TransactionSchema);