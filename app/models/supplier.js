
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	env = process.env.NODE_ENV || 'development',
	config = require('../../config/config')[env],
	Schema = mongoose.Schema;

var SuppliersSchema = new Schema({
	name: String,
	phoneNumber: String,
	email: String,
	address: String,
	contactPerson: String,
	contactPhone: String,
	daysSupply: String,
	daysPayment: String
});

/**
 * [statics SupplierSchema]
 * @type {Object}
 */
SuppliersSchema.statics = {
  /**
  * Auto Complete
  * @function autocomplete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    var wit = this.find({},'supplierName');
    wit.regex('supplierName',new RegExp(name, 'i')).exec(cb);
    
  }
};
mongoose.model('Supplier', SuppliersSchema);