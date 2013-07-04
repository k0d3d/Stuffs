
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema

/**
 * Orders Schema
 */
var OrderSchema = new Schema({
  orderID: {type: String, default: ''},
  orderType: {type: String, default: 'Medical Equipment'},
  itemID: {type: String, default: ''},
  orderAmount: {type: Number, default: '0'},
  orderDate: {type: Date, default: Date.now },
  orderDescription: {type: String, default: ''},
  orderSupplier: {type: String, default: ''},
  orderStatus: {type: String}
})

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
      .exec(cb)
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .exec(cb)
  }
}


mongoose.model('Order', OrderSchema)
