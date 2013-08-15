
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema
    pureautoinc  = require('mongoose-pureautoinc');

/**
 * Stock Down Location Schema 
 */
var StockDownSchema = new Schema({
  locationId: {type: Number},
  locationName: {type: String},
  locationAuthority:{type: String},
  locationDescription: {type: String},
  locationBoilingPoint: {type: Number},
  createdAt: {type: Date, default: Date.now}
});

StockDownSchema.plugin(pureautoinc.plugin, {
  model: 'location',
  field: 'locationId'
});

StockDownSchema.statics = {
  /**
  *List All Stock Down Points
  */
  list: function(callback){
    this.find().exec(callback);
  }
}

mongoose.model('Location', StockDownSchema);
