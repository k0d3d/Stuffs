
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  Schema = mongoose.Schema;
/**
 * Item Schema 
 */
var StockHistorySchema = new Schema({
  item: {type: Schema.ObjectId, ref: 'Item'},
  locationId: {type: Schema.ObjectId, ref: 'Location'},
  locationName: String,
  date: {type: Date, default: Date.now},
  amount: {type: Number, min: 0},
  action: String,
  reference: String
});


StockHistorySchema.methods = {
  /**
   * [augumentStock adds or removes stock from ]
   * @param  {[type]}   list     [description]
   * @param  {[type]}   location [description]
   * @param  {[type]}   others   [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  log: function log(itemObj, location, others, callback){
    this.item = itemObj.id;
    this.locationId = location.id;
    this.locationName = location.name;
    this.amount = itemObj.amount;
    this.action = others.action;
    this.reference = others.reference;
    this.save(function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};

StockHistorySchema.statics = {
  /**
   * [lookUp description]
   * @param  {[type]}   id       [description]
   * @param  {[type]}   location [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  lookUp: function lookUp(id, locationId, callback){
    var q = this.findOne({item: id, locationId: locationId});
    q.sort({date: -1});
    q.limit(1);
    q.exec(function(err, i){
      console.log(i);
      callback(i);
    });
  }
};



mongoose.model('StockHistory', StockHistorySchema);
