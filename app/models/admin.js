var
    Items = require('../models/item').Item,
    OrderModel = require('../models/order').Order,
    OrderStatus = require('../models/order').OrderStatus,
    Dispense = require('../models/dispense'),
    Bills = require('../models/bill').Bill,
    BillRules = require('../models/bill').BillRule,
    BillingProfile = require('../models/bill').BillingProfile,
    PointLocation = require('../models/location'),
    StockHistory = require('../models/stockhistory'),
    StockCount = require('../models/stockcount'),
    Transactions = require('../models/transaction'),
    UserModel = require('../models/user').UserModel,
    _ = require('lodash'),
    Q = require('q');

function AdminController () {

}

AdminController.prototype.constructor = AdminController;



// AdminController.prototype.login = function(deets){
//   var q = Q.defer(), adminInstance = this;

//   var dsItems = new DsItems();
//   dsItems.checkConsumerByEmail(deets)
//   .then(function (userInfo) {
//     adminInstance.updateUserProfile(deets.consumer_key)
//     .then(function () {

//       q.resolve(userInfo);
//     });
//   }, function(err) {
//     q.reject(err);
//   }) ;
//   return q.promise;

// };

AdminController.prototype.removeAllDispense = function(cb){
  Dispense.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllBills = function(cb){
  Bills.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllBillProfiles = function(cb){
  BillingProfile.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllRules = function(cb){
  BillRules.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllStockHistory = function(cb){
  StockHistory.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllStockCount = function(cb){
  StockCount.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllOrders = function(cb){
  OrderModel.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllOrderStatus = function(cb){
  OrderStatus.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllTransactions = function(cb){
  Transactions.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllItems = function(cb){
  Items.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};
AdminController.prototype.removeAllLocations = function(cb){
  PointLocation.remove({}, function(err, n){
    if(err){
      cb(err);
    }else{
      cb(n);
    }
  });
};

AdminController.prototype.createMainLocation = function(cb){
  //Check for a default location
  PointLocation.findOne({
    locationType: 'default'
  }, function(err, i){
    if(!_.isEmpty(i)){
      console.log('found');
      cb(i);
    }else{
      //Create a default loaction
      var pl = new PointLocation();
      pl.locationName =  'Main';
      pl.locationType = 'default';
      pl.locationDescription = 'Main Stock Location';
      pl.save(function(err, i){
        cb(i);
      });
    }
  });
};

AdminController.prototype.fetchUser = function fetchUser (csKey) {
  var q = Q.defer();


    UserModel.findOne({
      consumer_key: csKey
    })
    .exec(function (err, user) {
      if (err) {
        return q.reject(err);
      }
      return q.resolve(user);
    });

  return q.promise;
};


AdminController.prototype.updateUserProfile = function updateUserProfile (csKey, user) {
  var q = Q.defer();
  UserModel.update({
    consumer_key : csKey
  }, user,
  {upsert: true},
  function (err, done) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(done);
  });
  return q.promise;
};

module.exports = AdminController;