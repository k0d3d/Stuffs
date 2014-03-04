var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    ItemCategory = mongoose.model('ItemCategory'),
    ItemForm = mongoose.model('ItemForm'),
    ItemPackaging = mongoose.model('ItemPackaging'),
    Items = require('./items').item,
    Orders = mongoose.model('Order'),
    OrderStatus = mongoose.model('OrderStatus'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    BillRule = mongoose.model('BillRule'),
    BillingProfile = mongoose.model('BillingProfile'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    Transactions = mongoose.model('transaction'),
    _ = require("underscore"),
    NafdacDrugs = mongoose.model("nafdacdrug"),
    NDL = require("./nafdacs").ndl,
    rest = require('restler'),
    Admin = mongoose.model('admin'),
    querystring = require('querystring'),
    config = require('config'),
    util = require("util");

var online_api_url = config.api.stoc_cloud_url;

function AdminController () {

}

AdminController.prototype.constructor = AdminController;

AdminController.prototype.checkUpdates = function(req, cb){
  var r = [];
  var dt = new Date();
  var ld = req.session.lastUpdate || dt.toJSON();
  //var ld = '2013-10-29T16:42:17.158Z';
  var spoken = [];


  function speakPrice (){
    _.each(r[1], function(v, i){
      spoken.push(
        v.product_id.productName + ' by ' + v.product_id.man_imp_supp + ' updates price to ' + v.price
      );
    });
  }

  function speakOrders () {
    _.each(r[0], function(v, i){
      spoken.push(
        'Order for ' + v.order_id.orderAmount + ' ' +  v.order_id.nafdacRegName + ' from ' + v.order_id.orderSupplier[0].supplierName + ' is ' + v.status
      );
    });
  }

  function orderCheck(){
    rest.get(online_api_url + '/api/orders/hospital/1008/updates/' + ld)
    .on('success', function(data){
      if(!_.isEmpty(data)){
        var orders = new Orders();
        orders.isDispatched(data);
      }
      r.push(data);
      drugCheck(ld);
    })
    .on('error', function(err){
      cb(err);
    })
    .on('fail', function(err){
      cb(err);
    });
  }
  function drugCheck(){
    rest.get(online_api_url + '/api/drugs/updates/'+ld)
    .on('success', function(data){
      if(!_.isEmpty(data)){
        var ndl = new NDL();
        ndl.priceUpdated(data);
        var items = new Items();
        items.updateByReg(data);
      }
      r.push(data);

      speakPrice();
      speakOrders();

        //Final Callback :: remember to set last update
        req.session.lastUpdate = dt.toJSON();
        cb(spoken);
    })
    .on('error', function(err){
      cb(err);
    })
    .on('fail', function(err){
      cb(err);
    });
  }

  orderCheck();
};

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
  .on('error', function(d, r){
    cb(new Error(d));
  })
  .on('fail', function(d, r){
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
  Orders.remove({}, function(err, n){
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
  Item.remove({}, function(err, n){
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
}


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
    admin.checkUpdates(req, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
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

  app.del('/api/admin/reset', function(req, res, next){
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

}