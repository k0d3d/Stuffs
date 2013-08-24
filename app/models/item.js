
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema,
  pureautoinc  = require('mongoose-pureautoinc');

/**
 * Item Schema 
 */
var ItemSchema = new Schema({
  itemID: {type: Number, default: ''},
  itemType: {type: String, default: ''},
  itemName: {type: String, default: ''},
  sciName: {type: String, default: ''},
  manufacturerName: {type: String},
  itemCategory: {type: String},
  itemDescription: {type: String},
  itemBoilingPoint:{type: Number},
  packageSize:{type: String},
  form: {type: String},
  itemPurchaseRate: {type: String},
  itemSellingRate: {type: String},
  currentStock: {type: Number, default: 0},
  location: {type: String, default: 'Main'}
});

ItemSchema.plugin(pureautoinc.plugin, {
  model: 'Item',
  field: 'itemID'
});
/**
 * Statics
 */

ItemSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb);
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var fields = options.fields || {};
    this.find(criteria,fields)
      .exec(cb)
  },

  /**
  * Auto Complete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    var wit = this.find({},'itemName')
    wit.regex('itemName',new RegExp(name, 'i')).exec(cb)
    
  }


}


mongoose.model('Item', ItemSchema);
