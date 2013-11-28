/**
 * Module Dependencies
 */
var mongoose = require('mongoose');
var Ndl = mongoose.model('nafdacdrug'),
    util = require('util');

function ndlController () {

}

ndlController.prototype.constructor = ndlController;

/**
 * [searchComposition Searches list by drug composition]
 * @param  {[type]}   string   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ndlController.prototype.searchComposition = function(string, page, callback) {
  console.log('ive been');
  var wit = Ndl.find({},'productName composition category');
  wit.regex('composition',
    new RegExp(string, 'i')
  )
  .limit(10)
  .skip(page * 10)
  .exec(function(err, i){
    if(err){
      callback(err);
    } else {
      callback(i);
    }
  });
};

/**
 * [searchCategory Searches list by drug category]
 * @param  {[type]}   string   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ndlController.prototype.searchCategory = function(catString, page, callback) {
  var wit = Ndl.find({
    category: catString
  },
    'productName composition category'
  )
  .limit(10)
  .skip(page * 10)
  .exec(function(err, i){
    if(err){
      callback(err);
    } else {
      callback(i);
    }
  });
};

/**
 * [summary fetches ndl info]
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ndlController.prototype.summary = function (id, callback) {
  Ndl.findOne({ _id : id})
  .exec(function (err, i) {
    if(err){
      callback(err);
    } else {
      callback(i);
    }    
  });
};
module.exports.ndl = ndlController;
//var ndls = new ndlController();
