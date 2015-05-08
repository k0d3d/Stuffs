
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


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
  /*
  pending order: 0
  received: 1
  supplied: 2
  paid: 3
  complete: 4

   */
  orderStatus: {type: Number, default: 0},
  orderVisibility: {type: Boolean, default: true},
  onlineId: {type: Schema.ObjectId},
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


// OrderSchema.toObject({ getters: true, virtuals: false });

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
};


mongoose.model('Order', OrderSchema);
mongoose.model('OrderStatus', OrderStatusSchema);

module.exports.Order = mongoose.model('Order');
module.exports.OrderStatus = mongoose.model('OrderStatus');
