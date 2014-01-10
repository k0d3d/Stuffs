var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    ItemCategory = mongoose.model('ItemCategory'),
    ItemForm = mongoose.model('ItemForm'),
    ItemPackaging = mongoose.model('ItemPackaging'),
    Items = require('./items').item,
    Order = mongoose.model('Order'),
    Orders = require('./orders').order,
    OrderStatus = mongoose.model('OrderStatus'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    _ = require("underscore"),
    NafdacDrugs = mongoose.model("nafdacdrug"),
    NDL = require("./nafdacs").ndl,
    rest = require('restler'),
    Updater = mongoose.model('updater'),
    querystring = require('querystring'),
    util = require("util");

var online_api_url = 'http://localhost:3001';

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
  })
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
    })
  })

}