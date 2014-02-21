
/**
 * Module dependencies.
 */
var db = require("../../lib/db.js");
var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema,
  moment = require("moment");


/**
 * Orders Schema
 */
var OrderSchema = new Schema({
  orderType: {type: String, default: 'Medical Equipment'},
  itemData: {
            itemName: {type: String, default: ''},
            id: {type: Schema.ObjectId, ref: 'Item'}
            },
  nafdacRegNo: {type: String},
  nafdacRegName: {type: String},
  orderAmount: {type: Number, default: '0'},
  orderDate: {type: Date, default: Date.now },
  orderDescription: {type: String, default: 'None'},
  orderSupplier: [{
    supplierID: {type: String, default: ''},
    supplierName: {type: String, default: ''}
  }],
  amountSupplied: {type: Number},
  orderInvoice: {type: String, default: ''},
  orderStatus: {type: String, default: 'pending order'},
  orderVisibility: {type: Boolean, default: true},
  onlineId:{type: Schema.ObjectId},
  orderExpDate: {type: Date},
  orderPrice: {type: Number},
  paymentReferenceType: {type: String},
  paymentReferenceID: {type: String}
});

var OrderStatusSchema = new Schema({
  order_id: {type: Schema.ObjectId},
  date: {type: Date, default: Date.now},
  status: String
});


/**
 * Statics
 */

OrderSchema.statics = {

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
    var q = this.find(criteria);
    q.sort({orderDate: -1});
    q.exec(cb);
  }
}


mongoose.model('Order', OrderSchema);
mongoose.model('OrderStatus', OrderStatusSchema);
