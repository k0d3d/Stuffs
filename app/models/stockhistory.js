
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
var StockHistorySchema = new Schema({
  shID: Number,
  item: {type: Schema.ObjectId, ref: 'Item'},
  locationId: {type: Schema.ObjectId, ref: 'Location'},
  locationName: String,
  date: {type: Date, default: Date.now},
  amount: Number,
  action: String
});

StockHistorySchema.plugin(pureautoinc.plugin, {
  model: 'StockHistory',
  field: 'shID'
});

StockHistorySchema.methods = {
  /**
   * [augumentStock adds or removes stock from ]
   * @param  {[type]}   list     [description]
   * @param  {[type]}   location [description]
   * @param  {[type]}   option   [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  addStock: function addStock(list, location, callback){
    this.item = list.item;
    this.locationId = location.id;
    this.locationName = location.name;
    this.amount = list.amount;
    this.action = list.action;
    this.save(function(err, i){
      callback(i);
    });
  },

  decreaseStock: function decreaseStock(list, location, callback){
    this.item = list.item;
    this.locationId = location.id;
    this.locationName = location.name;
    this.amount = list.amount;
    this.action = list.action;
    this.save(function(err, i){
      console.log(err);
      callback(i);
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
  },
  /**
   * [mainStockCount gets the stock count for any item in the main 'stock up' inventory]
   * @param  {[type]}   id       [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  mainStockCount: function mainStockCount(id, callback){
    var q = this.findOne({item: id, locationName: 'Main'});
    q.sort({date: -1});
    q.limit(1);
    q.exec(function(err, i){
      callback(i);
    });
  },
  /**
   * [findAll description]
   * @param  {[type]}   locationId       [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  fetchStockDownRecordbyId: function findAll (locationId, callback){
    var q = this.find({locationId: locationId, action: 'Requested Stock'});
    q.populate('item','itemName itemID');
    q.sort({date: -1});
    q.exec(function(err, i){
      callback(i);
    });
  },

};



mongoose.model('StockHistory', StockHistorySchema);
