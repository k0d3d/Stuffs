
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  OrderStatus = mongoose.model('OrderStatus'),
  Item = mongoose.model('Item'),
  StockHistory = mongoose.model('StockHistory'),
  StockCount = mongoose.model('StockCount'),
  Supplier = mongoose.model('Supplier'),
  Ndl = require('./nafdacs').ndl,
  rest  = require('restler'),
  _ = require('underscore'),
  utils = require("util");

var online_api_url = 'http://localhost:3001';

function OrderController () {

}

OrderController.prototype.constructor = OrderController;


var postOrders = function(){
  Order.find({orderStatus: 'pending order'}, 'itemData orderAmount orderDate orderSupplier nafdacRegNo nafdacRegName')
  .exec(function(err, i){
    var one = JSON.stringify(i);
    if(err){
      utils.puts(err);
    }else{
      rest.postJson(online_api_url + '/api/orders', { data: one, hid: 1008} )
      .on('success', function(r){
        updateTracking(r);
      })
      .on('error', function(err){
        utils.puts(err);
      })
      .on('fail', function(err){
        utils.puts(err);
      });
    }
  });
};

var updateTracking = function(r){
  _.each(r, function(v, i){
    Order.update({_id: v.client}, {
      onlineId: v.online,
      orderStatus: 'received'
    }, function(err){
      if(err){
        utils.puts(err);
      }
    });
  });
};



/**
 * Create an order
 */
OrderController.prototype.createOrder = function (req, res) {
  var order = new Order(req.body);
  var itemObj = {itemName: req.body.itemData.itemName, _id: req.body.itemData._id};
  order.orderSupplier =  req.body.suppliers;
  order.itemData.push(itemObj);
  order.save(function (err) {
    if (!err) {
      postOrders();
      res.json({"task":"save-order","success": true});
    }else{
      console.log(err);
    }
  });
};


/**
 * List All Orders
 */

OrderController.prototype.getOrders = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 30;
  var options = {
    criteria: {orderVisibility: true}
  };

  Order.list(options, function(err, orders) {
    if (err) return res.render('500');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(orders));
    res.end();
  });
};

/**
 * Updates an order status and creates a stock record 
 */

OrderController.prototype.updateOrder = function(req, res, next){
  //Updates the order statuses, these are useful for order history
  //queries, etc
  var doOrderStatusUpdates = function (){
      //Updates the order status 
      Order.update({'_id':req.param('orderId')},{
        $set: {
          'orderStatus':req.body.status,
          'orderInvoice': req.body.orderInvoiceNumber,
          'amountSupplied': req.body.amountSupplied
        }
      }).exec(function(err,numberAffected){
        if(err)console.log(err);
      });

      //Creates a new record to show when this order was
      //updated and what action was taken.
      var orderstatus = new OrderStatus();
      orderstatus.status = req.body.status;
      orderstatus.order_id = req.param('orderId');
      orderstatus.save(function(err){
        if(err)return err;
        res.json(200, {"task": true, "result": req.body.status});
      });
  };

  //If this order gets supplied.
  if(req.body.status == 'supplied'){
    //Set the location to 'Main'
    var location ={
      name: 'Main'
    };

    var stockhistory = new StockHistory();
    // Check if this record has been created for this order using the orderid and the reference field 
    // on the StockHistoryShema
    StockHistory.count({'reference': 'orders-'+req.param('orderId')+'-'+req.body.orderStatus}, function(err, count){
      if(count > 0){
        res.json(400,{"message": "Invalid Order"});
      }else{
        var itemObj = {
          id: req.body.itemData._id,
          amount: req.body.amountSupplied
        };
        var options = {
          action: 'Stock Up',
          reference: 'orders-'+req.param('orderId')
        };
        //Create a stock history record.
        stockhistory.log(itemObj, location, options ,function(g){      
          // Updates or creates a stock count for the item 
          var u = StockCount.update({
            item: g.item,
            $or:[{
                locationName : g.locationName
              },{
                locationId: g.locationId
              }]
            },{
              $inc: {
                amount: g.amount
              },
              $set: {
                date: Date.now
              }
            }, function(err, i){
              if(i === 0){
                var stockcount = new StockCount(g);
                stockcount.save(function(err, i){
                  doOrderStatusUpdates();
                });
              }else{
                doOrderStatusUpdates();
              }
            });
        });
      }
    });
  }

  if(req.body.status == 'paid'){
    doOrderStatusUpdates();
  }

};

/**
 * [count description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
OrderController.prototype.count = function(req, res){
  var d = Order.count({orderVisibility: true});
  var m  = Order.count({orderVisibility: true});
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
OrderController.prototype.suppliersTypeahead = function(req, res){
  Supplier.autocomplete(req.param('query'), function(err, suppliers){
    if (err) return res.render('500');
     res.json(suppliers);
  });
};

/**
 * [removeOrder description]
 * @param  {[type]}   order_id   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
OrderController.prototype.removeOrder = function(order_id, callback){
  Order.update({_id: order_id}, {
    $set:{
      orderVisibility: false
    }
  }, callback);
};


OrderController.prototype.isDispatched = function(order){
  var lala = [];
  _.each(order, function(v, i){
    var orderId = v.order_id.h_order_Id.substr(v.hospitalId.length + 1);
    Order.update({_id: orderId}, {
      orderStatus: 'dispatched'
    }, function(err){
      if(err){
        utils.puts(err);
      }
    });

    var o = new OrderStatus();
    o.status = 'dispatched';
    o.order_id = orderId;
    o.save(function(err){
      if(err){
        utils.puts(err);
      }      
    });

  });
}

var ndls = new Ndl();

module.exports.order = OrderController;
var orders = new OrderController();

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
  app.get('/dashboard/orders/cart', function(req, res){
      res.render('index',{
        title: 'Order Cart'
      });
    }
  );
  //Order  GET routes
  app.get('/api/orders',orders.getOrders);
  app.get('/api/orders/count',orders.count);
  // app.get('/api/orders/supplier', orders.allSuppliers);
  // app.get('/api/orders/supplier/:id', orders.getSupplier);
  app.get('/api/orders/supplier/typeahead/:query', orders.suppliersTypeahead);

  // Order POST Routes
  app.post('/api/orders',orders.createOrder);
  //app.post('/api/orders/supplier', orders.createSupplier);

  //Order PUT Routes
  app.put('/api/orders/:orderId',orders.updateOrder);

  //Delete Order (logically)
  app.delete('/api/orders/:order_id', function(req, res){
    orders.removeOrder(req.param('order_id'), function(err, i){
      if(utils.isError(err)){
        next(err);
        return;
      }else{
        res.json(200, {state: 1});
      }
    });
  });

  //Search for nafdac reg drugs by composition
  app.get('/api/orders/ndl/:needle/composition/:page', function(req, res, next){
    ndls.searchComposition(req.params.needle, req.params.page, function(r){
      if(utils.isError(r)){
        next(r);
        return;
      }else{
        res.json(200, r);
      }
    });
  });

  //Search for nafdac reg drugs by category
  app.get('/api/orders/ndl/:needle/category/:page', function(req, res, next){
    ndls.searchCategory(req.params.needle, req.params.page, function(r){
      if(utils.isError(r)){
        next(r);
        return;
      }else{
        res.json(200, r);
      }
    });
  });
  //Search for nafdac reg drugs by category
  app.get('/api/orders/ndl/:drugId/summary', function(req, res, next){
    ndls.summary(req.params.drugId, function(r){
      if(utils.isError(r)){
        next(r);
        return;
      }else{
        res.json(200, r);
      }
    });
  });
};