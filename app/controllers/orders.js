
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  OrderStatus = mongoose.model('OrderStatus'),
  Item = mongoose.model('Item'),
  Supplier = mongoose.model('Supplier');

/**
 * Create an order
 */
var createOrder = function (req, res) {
  var order = new Order(req.body);
  itemObj = {itemName: req.body.itemData.itemName, itemID: req.body.itemData.itemID};
  order.itemData.push(itemObj);
  order.save(function (err) {
    if (!err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({"task":"save-order","success": true}));
      res.end();
    }else{
      console.log(err);
    }
  });
};


/**
 * List All Orders
 */

var getOrders = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 30;
  var options = {
  };

  Order.list(options, function(err, orders) {
    if (err) return res.render('500');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(orders));
    res.end();
  });
};

var updateOrder = function(req, res){
  console.log(req.param('orderId'));
  if(req.body.status == 'supplied'){
    Item.update({'itemID':req.body.itemId},{
      $inc: {
        'currentStock': req.body.amount
      }
    }).exec(function(err,numberAffected){
      if(err)console.log(err);
    });
  }
  Order.update({'orderID':req.param('orderId')},{
    $set: {
      'orderStatus':req.body.status
    }
  }).exec(function(err,numberAffected){
    if(err)console.log(err);
  });
  orderstatus = new OrderStatus();
  orderstatus.status = req.body.status;
  orderstatus.order_id = req.param('orderId');
  orderstatus.save(function(err){
    if(err)return err;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({"task": true}));
    res.end();
  });
};

var count = function(req, res){
  var d = Order.count();
  var m  = Order.count();
  m.where('orderStatus').equals('pending order');
  d.where('orderStatus').equals('supplied');
  d.exec(function(err,y){
    if(err)console.log(err);
    m.exec(function(err, o){
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({"pendingpayment":y,"pendingorders":o}));
      res.end();
    });
  });
};

/**
 * [createSupplier description]
 * @method createSupplier
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var createSupplier = function(req,res){

};
/**
 * [allSuppliers description]
 * @method allSuppliers
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var allSuppliers = function(req, res){

};

/**
 * [getSupplier description]
 * @method getSupplier
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var getSupplier = function(req, res){

};

/**
 * [suppliersTypeahead description]
 * @method suppliersTypeahead
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var suppliersTypeahead = function(req, res){
  Supplier.autocomplete(req.param('query'), function(err, suppliers){
    if (err) return res.render('500');
     res.json(suppliers);
  });
};


module.exports.routes = function(app){

  app.get('/dashboard/order', function(req, res){
      res.render('index',{
        title: 'Place new order'
      });
    }
  );
  app.get('/dashboard/order/:id', function(req, res){
      res.render('index',{
        title: 'Place new order'
      });
    }
  );
  app.get('/orders', function(req, res){
      res.render('index',{
        title: 'All orders'
      });
    }
  );
  //Order  GET routes
  app.get('/api/orders',getOrders);
  app.get('/api/orders/count',count);
  app.get('/api/orders/supplier', allSuppliers);
  app.get('/api/orders/supplier/:id', getSupplier);
  app.get('/api/orders/supplier/typeahead/:query', suppliersTypeahead);

  // Order POST Routes
  app.post('/api/orders',createOrder);
  app.post('/api/orders/supplier', createSupplier);

  //Order PUT Routes
  app.put('/api/orders/:orderId',updateOrder);

};