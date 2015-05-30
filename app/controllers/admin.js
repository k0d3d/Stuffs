
var util = require('util'),
    Admin = require('../models/admin'),
    Order = require('../models/order').order,
    DSItems = require('../models/dsitem');





module.exports.routes = function(app){
  var admin = new Admin(), order = new Order();
  app.get('/admin',function(req, res){
    res.render('index',{
      title: 'Admin Area'
    });
  });

  app.get('/api/admin/updates',  function(req, res, next){
    var dsitem = new DSItems();
    //return  res.json(200,['happu']);
    dsitem.checkProductUpdates()
    .then(function(r){
      order.postOrders()
      .then(function () {
        res.json(r);
      }, function (err) {
        next(err);
      });
    }, function (err) {
      res.status(400).json(err.message);

    });
  });

  app.route('/api/admin/user-profile')
  .get(function (req, res, next) {
    admin.fetchUser(req.consumer_key)
    .then(function (user) {
      res.json(user);
    }, function (err) {
      next(err);
    });
  })
  .post(function (req, res, next) {
    admin.updateUserProfile(req.consumer_key, req.body)
    .then(function (r) {
      res.json(r);
    }, function (err) {
      next(err);
    });
  });

  app.post('/api/admin/update-product-information',  function(req, res){
    var dsitem = new DSItems();
    dsitem.refreshProductInformation(req)
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

  app.post('/admin/session', function(req, res, next){
    var dsitem = new DSItems();
    dsitem.checkConsumerByEmail(req.body)
    .then(function(d){
      d.customer_id = d.id;
      admin.updateUserProfile(d.consumer_key, d)
      .then(function () {
        res.json(true);
      }, function (err) {
        next(err);
      });

    }, function (err) {
      next(err);
    });
  });
  //Get facility information
  app.get('/api/admin/facility', function (req, res, next) {

  });

  //update facility information
  app.put('/api/admin/facility', function (req, res, next) {

  });

}