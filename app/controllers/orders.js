
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
  utils = require("util");

/**
 * Create an order
 */
var createOrder = function (req, res) {
  var order = new Order(req.body);
  var itemObj = {itemName: req.body.itemData.itemName, itemID: req.body.itemData.itemID, _id: req.body.itemData._id};
  order.orderSupplier.push({supplierName: req.body.orderSupplierName});
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

var updateOrder = function(req, res){
  //Updates the order statuses, these are useful for order history
  //queries, etc
  var doOrderStatusUpdates = function (){
      //Updates the order status 
      Order.update({'_id':req.param('orderId')},{
        $set: {
          'orderStatus':req.body.status,
          'orderInvoice': req.body.orderInvoiceNumber
        }
      }).exec(function(err,numberAffected){
        if(err)console.log(err);
      });

      //Creates a new record to show when this order was
      //updated and what action was taken.
      orderstatus = new OrderStatus();
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
    StockHistory.count({'reference': 'orders-'+req.param('orderId')}, function(err, count){
      if(count > 0){
        res.json(400,{"message": "Invalid Order"});
      }else{
        var itemObj = {
          id: req.body.itemData._id,
          amount: req.body.amount
        };
        //Create a stock history record.
        stockhistory.createRecord(itemObj, location, 'Stock Up','orders-'+req.param('orderId') ,function(g){      
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
var count = function(req, res){
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
var suppliersTypeahead = function(req, res){
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
var removeOrder = function(order_id, callback){
  Order.update({_id: order_id}, {
    $set:{
      orderVisibility: false
    }
  }, callback);
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

  //Delete Order (logically)
  app.delete('/api/orders/:order_id', function(req, res){
    removeOrder(req.param('order_id'), function(err, i){
      if(utils.isError(err)){
        res.json(500, err);
        return;
      }else{
        res.json(200, {state: 1});
      }
    });
  });

};