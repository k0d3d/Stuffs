
/**
 * Module dependencies.
 */

var
    Supplier = require('./user/supplier-schema'),
    _ = require('lodash');



function SupplierModel (){

}

SupplierModel.prototype.constructor = Supplier;

/**
 * [add description]
 * @param {[type]}   supplierData [description]
 * @param {Function} callback     [description]
 */
SupplierModel.prototype.add = function(supplierData, callback){
  if(_.isEmpty(supplierData)){
    return callback(new Error('empty submission'));
  }
  var supplier = new Supplier(supplierData);
  supplier.save(function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [list Gets All the Suppliers]
 * @param  {[type]}   options  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
SupplierModel.prototype.list = function(options, callback){
  var limit = options.limit || 10;
  Supplier
  .find({})
  .limit(limit)
  .skip(options.page * limit)
  .sort({
    supplierName: 1
  })
  .exec(function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [update updates the supplierData]
 * @param  {[type]}   supplierData [description]
 * @param  {Function} callback     [description]
 * @return {[type]}                [description]
 */
SupplierModel.prototype.update = function(supplierData, callback){
  var omitted = _.omit(supplierData, "_id");
  Supplier.update({_id: supplierData._id}, omitted, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [one fetches data on a supplier]
 * @param  {[type]}   supplierId [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
SupplierModel.prototype.one = function(supplierId, callback){
  Supplier.findById(supplierId, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};
/**
 * [one fetches data on a supplier]
 * @param  {[type]}   supplierId [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
SupplierModel.prototype.search = function(query, callback){
  query.limit = 20;
  Supplier.search(query, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [remove remove a supplier]
 * @param  {[type]}   supplier_id [description]
 * @param  {Function} callback    [description]
 * @return {[type]}               [description]
 */
SupplierModel.prototype.remove= function(supplier_id, callback){
  Supplier.remove({"_id": supplier_id}, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [typeahead typeahead functions ]
 * @param  {[type]}   query    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
SupplierModel.prototype.typeahead  = function(query, callback){
  Supplier.autocomplete(query, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

SupplierModel.prototype.sendNotice = function(id, type, cb){

  function put_notice (d) {
    console.log(d);
    if(type === 'sms' && !_.isUndefined(d.contactPersonPhone)){
      var phones = d.contactPersonPhone.split(",");
      phones = _.map(phones, function(v){
        return v.trim();
      });

      return phones;
    }

    return(new Error('no phone numbers found'));
  }

  Supplier.findOne({
    _id: id
  }, function(err, i){
    if(err){
      cb(err);
    }else{
      cb(put_notice(i));
    }
  });

};

module.exports = SupplierModel;