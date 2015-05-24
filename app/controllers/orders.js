var
    Items = require('./items').item,
    Order = require('../models/order').Order,
    DsItems = require('../models/dsitem'),
    OrderStatus = require('../models/order').OrderStatus,
    PointLocation = require('../models/location'),
    Supplier = require('../models/supplier'),
    _ = require('lodash'),
    Ndl = require('./nafdacs').ndl,
    EventRegister = require('../../lib/event_register').register,
    StockManager = require('./stock').manager,
    Ndl = require('./nafdacs').ndl,
    debug = require('debug'),
    utils = require('util');
/**
 * Module dependencies.
 */

function OrderController () {

}

OrderController.prototype.constructor = OrderController;

var updateTracking = function (r) {
  Order.update({
    orderStatus: 1
  }, {
    $set: {
      orderStatus: 2,
      order_number: r.order_number
    }
  }, function (err, n) {
    console.log(err);
    console.log(n);
  });

};

var postOrders = function(){
  Order
  .find({orderStatus: 1}, 'itemId product_id itemName orderAmount orderDate orderSupplier nafdacRegNo nafdacRegName')
  .where('isDrugStocOrder', true)
  .populate({
    path: 'itemId',
    model: 'item'
  })
  .exec(function(err, i){
    // var one = JSON.stringify(i);
    if(err){
      return debug(err);
    }else
    if (i.length) {
      var dsItems = new DsItems();

      dsItems.postDSCloudOrders(i)
      .then(function (r) {
        updateTracking(r.order);
      }, function (err) {
        console.log(err);
      })
      .catch(function (err) {
        console.log(err.stack);
      });
      return;
    }
    return;
  });
};


OrderController.prototype.placeCart = function(cartObj, cb){
  if(_.isEmpty(cartObj)) return cb(new Error('Empty Request'));
  var doneIds = [],
      i = Date.now().toString(),
      order_group_id = i.substring(i.length - 6);

  function _create(){
    var item = cartObj.pop();
    var l = cartObj.length;

    Order.update({
      _id: item.orderId,
    }, {
      $set: {
        orderStatus: 1,
        order_group_id: order_group_id
      }
    }, function (err, n) {

      //Check if the object returned is an error
      if(err){
        //if we have some processed results
        //return that
        if(doneIds.length){
          return cb(doneIds);
        }else{
          return cb(n);
        }

      }else{
        //Add another done/placed order
        doneIds.push(item.orderId);
        if(l--){
          _create();
        }else{
          postOrders();
          cb(doneIds);
        }
      }
    });
  }

  _create();
};



/**
 * Create an order
 */
OrderController.prototype.createOrder = function (orderObj, cb) {

  var register = new EventRegister();

  //Checks if an itemId is present in a request.
  //the absence of an itemId creates a new item
  register.once('checkId', function(data, isDone){
    // console.log(data);
    // return isDone(data);
    var isDrugStocOrder = data.isDrugStocOrder;

    if(isDrugStocOrder && !data.itemId){
      //Lets go create a new Item and return its id
      var item = new Items();
      item.create({
        item: data
      }, function(d){
        data.id = d._id;
        isDone(data);
      });
    }else{
      isDone(data);
    }
  });

  register.once('saveOrder', function(data, isDone){

    var order = new Order(data);

    order.save(function (err, newOrder) {
      if (err) {
        isDone(err);
      }

      if (newOrder.orderStatus > 0) {
        postOrders();
      }
      isDone(true);
    });
  });



  register
  .queue('saveOrder')
  // .queue('checkId', 'saveOrder')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(i){
    cb(i);
  })
  .start(orderObj);


};


/**
 * List All Orders
 */

OrderController.prototype.getOrders = function(req, res){

  var options = {
    conditions: {
      orderVisibility: true,
      orderStatus: {'$ne' : 0}
    }
  };

  Order.list(options, function(err, orders) {
    if (err) return res.render('500');
    res.json(orders);
  });
};


/**
 * List All Cart
 */

OrderController.prototype.getOrderCart = function getOrderCart (req, res){

  var options = {
    conditions: {
      orderVisibility: true,
      orderStatus : 0
    }
  };

  Order.list(options, function(err, orders) {
    if (err) return res.render('500');
    res.json(orders);
  });
};

/**
 * Updates an order status and creates a stock record
 */

OrderController.prototype.updateOrder = function(orderbody, orderId, cb){

  var register = new EventRegister();

  //Switch / Conditional Event Queue
  var whatOrder;

  register.once('supplyUpdate', function(data, isDone){
    //Updates the order statuses, these are useful for order history
    //queries, etc

    //Updates the order status
    Order.update({
      '_id':orderId
    },{
      $set: {
        'orderStatus':data.orderbody.orderStatus,
        'orderInvoiceNumber': data.orderbody.orderInvoiceNumber,
        'amountSupplied': data.orderbody.amountSupplied,
      }
    })
    .exec(function(err){
      if(err){
        isDone(err);
      }else{
        isDone(data);
      }

    });
  });

  register.once('paidUpdate', function(data, isDone){
    //Updates the order statuses, these are useful for order history
    //queries, etc

    //Updates the order status
    Order.update({
      '_id':orderId
    },{
      $set: {
        'orderStatus':data.orderbody.orderStatus,
        'paymentReferenceType': data.orderbody.paymentReferenceType,
        'paymentReferenceID': data.orderbody.paymentReferenceID
      }
    })
    .exec(function(err){

      if(err){
        isDone(err);
      }else{
        isDone(data);
      }

    });
  });

  register.once('statusUpdate', function(data, isDone){
    //Creates a new record to show when this order was
    //updated and what action was taken.
    var orderstatus = new OrderStatus();
    orderstatus.status = data.orderbody.status;
    orderstatus.order_id = orderId;
    orderstatus.save(function(err){
      if(err)return isDone(err);
      isDone(data.orderbody.status);
    });
  });

  register.once('supplyOrder', function(data, isDone){
      var stockman = new StockManager();
      //return console.log(stockman);

      //For reference
      data.location.destination.options = {
        action: 'Stock Up',
        reference: 'orders-'+ orderId
      };

      //Since Orders for main stock have no
      //internal source location (they come from the supplier)
      //set this to true to overide our source.
      data.isMain = true;

      var reqObject = [
        {
          id: data.orderbody.itemId,
          itemName: data.orderbody.itemName,
          amount: data.orderbody.amountSupplied,
        }
      ];

      //This will handle stocking down
      stockman.stocking(reqObject, data.location, 'order',  function(d){
        isDone(data);
      });
  });


  register.once('getMainLocation', function(data, isDone){
    PointLocation.findOne({locationType: 'default'},
      function(err, i){
        if(err){
          isDone(err);
        }else{
          data.location = {
            destination:{
              id: i._id,
              name: i.locationName
            }
          };
          isDone(data);
        }
      });
  });

  //Switch / Conditional Event Queue
  switch(orderbody.orderStatus){
    case 4: //paid
      whatOrder = ['paidUpdate', 'statusUpdate'];
      break;
    case 3: //supplied
      whatOrder = ['getMainLocation', 'supplyOrder', 'supplyUpdate', 'statusUpdate'];
      break;
    default:
      whatOrder = ['statusUpdate'];
      break;
  }

  register
  .queue(whatOrder)
  .onError(function(r){
    cb(r);
  })
  .onEnd(function(r){
    cb(r);
  })
  .start({orderbody: orderbody, orderId: orderId});

};

/**
 * [count description]
 *
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
OrderController.prototype.count = function(cb){

  //TODO:: Use mongodb agreegators for this
  var register = new EventRegister();

  register.once('doInvoice', function(data, isDone){
    var d = Order.count({orderVisibility: true, orderStatus: 3});
    d.exec(function(err,y){
      if(err){
        cb(err);
      }else{
        data.pendingpayment = y;
        isDone(data);
      }
    });
  });

  register.once('doOrder', function(data, isDone){
    var d = Order.count({orderVisibility: true, orderStatus: 1});
    // d.or([{orderStatus: 'pending order'}, {orderStatus: 'Pending Order'}, {orderStatus: 'PENDING ORDER'}]);
    d.exec(function(err,y){
      if(err){
        cb(err);
      }else{
        data.pendingorders = y;
        isDone(data);
      }
    });
  });

  register
  .queue('doInvoice', 'doOrder')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(r){
    cb(r);
  })
  .start({'pendingpayment':0,'pendingorders':0});
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
  return false;
  if (!order.length) {
  }
  _.each(order, function(v){
    var orderId = v.order_id.h_order_Id.substr(v.hospitalId.length + 1);
    Order.update({_id: orderId}, {
      orderStatus: 0
    }, function(err){
      if(err){
        utils.puts(err);
      }
    });

    var o = new OrderStatus();
    o.status = 0;
    o.order_id = orderId;
    o.save(function(err){
      if(err){
        utils.puts(err);
      }
    });

  });
};

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

  app.get('/orders/pending/:type', function(req, res){
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
  app.get('/api/cart',orders.getOrderCart);
  app.get('/api/orders/count', function(req, res, next){
    orders.count(function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });
  // app.get('/api/orders/supplier', orders.allSuppliers);
  // app.get('/api/orders/supplier/:id', orders.getSupplier);
  app.get('/api/orders/supplier/typeahead/:query', orders.suppliersTypeahead);

  // Order POST Routes
  app.post('/api/orders', function(req, res,next){
    orders.createOrder(req.body, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, true);
      }
    });
  });
  // Order POST Routes
  app.post('/api/orders/cart', function(req, res,next){
    orders.placeCart(req.body, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });
  //app.post('/api/orders/supplier', orders.createSupplier);

  //Order PUT Routes
  app.put('/api/orders/:orderId', function(req, res, next){
    var orderbody = req.body;
    var orderId = req.params.orderId;

    orders.updateOrder(orderbody, orderId, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, {"task": true, "result": r});
      }
    });
  });

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
    var limit = req.query.limit || 10;
    ndls.searchComposition(req.params.needle, req.params.page, limit, function(r){
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