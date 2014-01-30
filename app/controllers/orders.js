
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Items = require('./items').item,
  EventRegister = require('../../lib/event_register').register,
  StockManager = require('./stock').manager,
  PointLocation = mongoose.model('Location'),
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

OrderController.prototype.placeCart = function(cartObj, cb){
  var self = this;
  var doneIds = [];

  function _create(){
    var item = cartObj.pop();
    var l = cartObj.length;


    var itemName = item.itemName;
    var supplier = item.supplier;
    var id = item.itemId;

    var order = new Order(item);
    var itemObj = {itemName: itemName, _id: id};
    order.orderSupplier =  supplier;

    order.itemData.push(itemObj);
    
    order.save(function (r) {
      //Check if the object returned is an error
      if(utils.isError(r)){
        //if we have some processed results
        //return that
        if(doneIds.length > 0){ 
          return cb(doneIds);
        }else{
          return cb(r);
        }

      }else{
        //Add another done/placed order
        doneIds.push(id);
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
    var id = data._id || data.itemData._id;

    if(!id){
      //Lets go create a new Item and return its id
      var item = new Items();
      item.create({
        item:{
          itemName: data.itemData.itemName,
          nafdacRegNo: data.nafdacRegNo,
          sciName: data.sciName
        }
      }, function(d){
        data.id = d._id
        isDone(data);
      });
    }else{
      data.id = id;
      isDone(data);
    }
  });

  register.once('saveOrder', function(data, isDone){
    var itemName = data.itemName || data.itemData.itemName;
    var supplier = data.supplier || data.suppliers;

    var order = new Order(data);
    var itemObj = {itemName: itemName, _id: data.id};

    order.orderSupplier =  supplier;

    order.itemData.push(itemObj);
    
    order.save(function (err) {
      if (!err) {
        postOrders();
        isDone(true);
      }else{
        isDone(new Error(err));
      }
    });
  })



  register
  .queue('checkId', 'saveOrder')
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

OrderController.prototype.updateOrder = function(orderbody, orderId, cb){

  var register = new EventRegister();

  //Switch / Conditional Event Queue
  var whatOrder;

  register.once('statusUpdate', function(data, isDone){
    //Updates the order statuses, these are useful for order history
    //queries, etc

    //Updates the order status 
    Order.update({
      '_id':data.orderId
    },{
      $set: {
        'orderStatus':data.orderbody.status,
        'orderInvoice': data.orderbody.orderInvoiceNumber,
        'amountSupplied': data.orderbody.amountSupplied
      }
    })
    .exec(function(err,numberAffected){

      if(err)isDone(err);

    });

    //Creates a new record to show when this order was
    //updated and what action was taken.
    var orderstatus = new OrderStatus();
    orderstatus.status = data.orderbody.status;
    orderstatus.order_id = data.orderId;
    orderstatus.save(function(err){
      if(err)return isDone(err);
      isDone(data.orderbody.status);
    });    
  })

  register.once('supplyOrder', function(data, isDone){
      var stockman = new StockManager();
      //return console.log(stockman);

      //For reference 
      data.location.origin.options = {
        action: 'Stock Up',
        reference: 'orders-'+ data.orderId     
      };

      //Since Orders for main stock have no 
      //internal source location (they come from the supplier)
      //set this to true to overide our source.
      data.isMain = true;

      var reqObject = [
        {
          item: data.orderbody.itemData._id,
          itemName: data.orderbody.itemData.itemName,
          amount: data.orderbody.amountSupplied,
        }      
      ];

      //This will handle stocking down
      stockman.stockUp(reqObject, data.location,  function(d){
        isDone(data);
      })
  });


  register.once('getMainLocation', function(data, isDone){    
    PointLocation.findOne({locationType: 'default'}, 
      function(err, i){
        if(err){
          isDone(err);
        }else{
          data.location = {
            origin:{
              id: i._id,
              name: i.locationName
            }
          };
          isDone(data);
        }
      });
  });  

  //Switch / Conditional Event Queue
  switch(orderbody.status){
    case 'paid':
      whatOrder = ['statusUpdate'];
      break;
    case 'supplied':
      whatOrder = ['getMainLocation', 'supplyOrder', 'statusUpdate'];
      break;
    default:
      whatOrder = ['statusUpdate'];
      break;
  };

  register
  .queue(whatOrder)
  .onError(function(r){
    cb(err)
  })
  .onEnd(function(r){
    cb(r)
  })
  .start({orderbody: orderbody, orderId: orderId});

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
  m.where('orderStatus').equals('received');
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