/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


var DsOnlineScehma = new Schema ({
  title : {type: String, default: '', required: true},
  sku : {type: String, required: true},
  price : {type: Number, required: true},
  regular_price : {type: Number, required: true},
  description : {type: String, required: true},
  categories : [{type: String, required: true}],
  tags : [{type: String, required: true}],
  imagesSrc: [{type: String, required: true}],
  attributes: [{
    'name': {type: String},
    'options': [{type: String}]
  }],
  currentPrice:{type: Number},
  created_at: {type: Date},
  updated_at: {type: Date},
  permalink: {type: String}
});





DsOnlineScehma.statics = {
  /**
  * Auto Complete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    // var wit = this.find({}).limit(20);
    // wit.or([
    //   {'productName': {$regex: new RegExp(name, 'i')}},
    //   {'composition': {$regex: new RegExp(name, 'i')}}
    // ])
    // .exec(cb);
    var wit = this.find({});
    wit.regex('title',new RegExp(name, 'i')).exec(cb);
  }
};


mongoose.model('dsitem', DsOnlineScehma);
module.exports = mongoose.model('dsitem');
