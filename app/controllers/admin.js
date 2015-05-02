var
    Items = require('../models/item').Item,
    // ItemCategory = require('../models/item').ItemCategory,
    // ItemForm = require('../models/item').ItemForm,
    // ItemPackaging = require('../models/item').ItemPackaging,
    OrderController = require('./orders').order,
    OrderModel = require('../models/order').Order,
    OrderStatus = require('../models/order').OrderStatus,
    Dispense = require('../models/dispense'),
    DSItems = require('../models/dsitem'),
    Bills = require('../models/bill').Bill,
    BillRules = require('../models/bill').BillRule,
    BillingProfile = require('../models/bill').BillingProfile,
    PointLocation = require('../models/location'),
    StockHistory = require('../models/stockhistory'),
    StockCount = require('../models/stockcount'),
    Transactions = require('../models/transaction'),
    _ = require('lodash'),
    // NafdacDrugs = require("../models/nafdacdrugs"),
    NDL = require('./nafdacs').ndl,
    rest = require('restler'),
    // Admin = require('../models/admin'),
    // querystring = require('querystring'),
    config = require('config'),
    util = require('util');

var online_api_url = config.api.DS_CLOUD_URL;

function AdminController () {

}

AdminController.prototype.constructor = AdminController;



AdminController.prototype.login = function(email, password, cb){
  rest.post(online_api_url+ '/api/users/session', {
    data: {
      email : email,
      password: password
    }
  })
  .on('success', function(d){
    cb(d);
  })
  .on('error', function(d){
    cb(new Error(d));
  })
  .on('fail', function(d){
    cb(new Error(d));
  });
};

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

AdminController.prototype.fetchHI = function (cb) {
  restler.get(config.online_api_url + '')
};


module.exports.admin = AdminController;
var admin = new AdminController();

module.exports.routes = function(app){
  app.get('/admin',function(req, res){
    res.render('index',{
      title: 'Admin Area'
    });
  });

  app.get('/api/admin/updates',  function(req, res, next){
    //return res.json(200,['happu']);
    // admin.checkUpdates(req, function(r){
    //   if(util.isError(r)){
    //     next(r);
    //   }else{
    //     res.json(404, r);
    //   }
    // });
    res.json(true);
  });

  app.post('/api/admin/update-product-information',  function(req, res, next){
    // return res.status(200).json(['happu']);
    DSItems.refreshProductInformation(req)
    .then(function(r){
        res.json(r);
    }, function (err) {
      res.status(400).json(err);
    });
  });

  app.post('/api/admin/setup', function(req, res, next){
    admin.createMainLocation(function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.delete('/api/admin/reset', function(req, res, next){
    function cb(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, {count: r});
      }
    }
    switch(req.query.aspect){
      case 'items':
        admin.removeAllItems(cb);
        break;
      case 'stock':
        admin.removeAllStockCount(cb);
        break;
      case 'dispense':
        admin.removeAllDispense(cb);
        break;
      case 'bills':
        admin.removeAllBills(cb);
        break;
      case 'billprofiles':
        admin.removeAllBillProfiles(cb);
        break;
      case 'billrules':
        admin.removeAllRules(cb);
        break;
      case 'stockhistory':
        admin.removeAllStockHistory(cb);
        break;
      case 'orders':
        admin.removeAllOrders(cb);
        break;
      case 'orderstatuses':
        admin.removeAllOrderStatus(cb);
        break;
      case 'transactions':
        admin.removeAllTransactions(cb);
        break;
      case 'locations':
        admin.removeAllLocations(cb);
        break;
      default:
        cb(new Error('Can not find the target aspect; reset failed'));
      break;
    }
  });

  app.delete('/api/admin/updates', function(req, res){
    var t = new Date();
    req.session.lastUpdate = t.toJSON();
    res.json(200, true);
  });

  app.post('/admin/session', function(req, res){
    admin.login(req.body.email, req.body.password, function(d){
      if(util.isError(d)){
        res.json(401, false);
      }else{
        res.json(200, d);
      }
    });
  });
  //Get facility information
  app.get('/api/admin/facility', function (req, res, next) {

  });

  //update facility information
  app.put('/api/admin/facility', function (req, res, next) {

  });

}