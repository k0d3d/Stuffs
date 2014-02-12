/**
 * Stock Controller Class
 * Module Dependcies
 */
var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    Order = mongoose.model('Order'),
    OrderStatus = mongoose.model('OrderStatus'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    _ = require("underscore"),
    cors = require('../../config/middlewares/cors'),
    EventRegister = require('../../lib/event_register').register,
    Transaction = require('./transactions'),
    util = require("util");


function StockController (){
  //Very important #Combination Inheritance(pseudoclassical inheritance)
  Transaction.transaction.call(this);
}

util.inherits(StockController, Transaction.transaction);

StockController.prototype.constructor = StockController;

/**
 * [createLocation Creates a Stock Down Location]
 * @param  {[type]} obj [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
StockController.prototype.createLocation = function(obj, callback){
  var pl = new PointLocation(obj);
  pl.save(function(err, saved){
    if(err) return callback(err);
    var s = {
      locationAuthority: saved.locationAuthority,
      locationBoilingPoint: saved.locationBoilingPoint,
      locationId: saved.locationId,
      locationName: saved.locationName
    };
    callback(s);
  });
};

/**
 * Fetches locations by type. A facility should possess 
 * just one Default/Main stock location where orders from 
 * suppliers will be processed. All other lcoations are regarded
 * as stock-down points /locations. The 'type' argument should
 * determine if the result is the main stock location or the 
 * available stock down points.
 * @param  {[type]}   type     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
StockController.prototype.getAllLocations = function(type, callback){
  if(type.length === 0){
    type = undefined;
  }
  PointLocation.list(type, function(err, r){
    if(err) return callback(err);
    callback(r);
  });
};


/**
 * Fetches a stock down record using the location Id
 * @param  {[type]} location_id [description]
 * @param  {[type]} callback         [description]
 * @return {[type]}             [description]
 */
StockController.prototype.getStockDown = function (location_id, callback){
  StockCount.fetchStockDownRecordbyId(location_id, function(v){
    callback(v);
  });
};

/**
 * stockDown Handles Stock Down Operation. The whole process is event based
 * the parent event 'stockDown' initiates a recusive event which calls a list 
 * of child events on the data 'obj' sent. 
 * @param {Array} reqObject This contains all the drug items to stock down including the amount. 
 * @param  {Object} location Object with origin and/or destination properties.
 * @param {String} operation Specifies what stock operation is to be carried out. 
 * @param  {[type]} callback [description]
 * @return {[type]}     [description]
 */
StockController.prototype.stocking = function(reqObject, location, operation, callback){
  var sc_self = this;
  //Inherited from transactions.
  //Loads the transaction model into 
  //the transModel property
  sc_self.initiate();
  //return ;
  
  var eventRegister = new EventRegister();

  eventRegister.on('initial', function(data, isDone){

    //Insert the new stock history record 
    //on the transaction model.
    sc_self.insertRecord(data, location.origin, location.destination, function(r){
      if(util.isError(r)){
        isDone(r);
      }else{
        data.currentTransaction = r;
        isDone(data);
      }
    });
  });

  eventRegister.on('pending', function(data, isDone){
    sc_self.makePending(function(r){
      if(util.isError(r)){
        isDone(r);
      }else{
        isDone(data);
      }
    });   
  });
  
  eventRegister.on('commit', function(data, isDone){
    sc_self.makeCommited(function(r){
      if(util.isError(r)){
        isDone(r);
      }else{
        isDone(data);
      }
    });
  });  
  
  eventRegister.on('cleanPendingSource', function(data, isDone){
    sc_self.cleanPending(StockCount, data.currentTransaction.origin.id, data.id, function(r){
      if(util.isError(r)){
        isDone(r);
      }else{
        isDone(data);
      }
    });
  });   
  eventRegister.on('cleanPendingDest', function(data, isDone){
    sc_self.cleanPending(StockCount, data.currentTransaction.destination.id, data.id, function(r){
      if(util.isError(r)){
        isDone(r);
      }else{
        isDone(data);
      }
    });
  });  
  eventRegister.on('done', function(data, isDone){
    sc_self.makeDone(function(r){
      if(util.isError(r)){
        isDone(r);
      }else{
        isDone(data);
      }
    });
  });

  eventRegister.on('stockAvailability', function(data, isDone){
    var self = this;

    StockCount.findOne({
        item: data.id,
        locationId: location.origin.id
    }, 'amount', function(err, a){
        if(err){
            isDone(err);
        }else if(!a){
          isDone(new Error('Cant find stock amount'));
        }
        else if ((a.amount - data.amount) < 0){
            
            isDone(new Error('Stock requested is unavailable;'));
        }else{
            isDone(data);
        }
    });    
  })

  eventRegister.on('sourceUpdate', function(data, isDone){
    // console.log('Im at main update with:');
    var sc_self = this;

    var originLocation = {
      id : location.origin.id,
      name: location.origin.name,
      options: location.origin.options
    };

    //Fix in the transactionId into options
    originLocation.options.transactionId = data.currentTransaction.id;

    var originUpdate = mongoose.model("StockCount");

    
    //Deducts the amount from each items main stock count.
    //Important:: Stock down means decrementing the 
    //amount from the main stock count
    originUpdate.update({
      item: data.id,
      locationId : originLocation.id,
      //Checking / filtering with $ne ensures that
      //this particular transaction does not already 
      //exist
      pendingTransactions: { $ne : data.currentTransaction.id}
      
      },{
        $inc: {
          amount: -data.amount
        },
        //pushing this transactions id into the 
        //pending transaction's array serves as a check
        //if this trasaction for any reason becomes a duplicate
        //or is repeated. Possibly because of failure, the presence
        //of this value will provide the admin with options to rollback
        //or disallow a repeat transaction.
        $push:{
          pendingTransactions: data.currentTransaction.id
        }
      }, function(err, i){
          if(err) {
            isDone(err);
          }else{
            data.forLocation = originLocation;
            isDone(data);
          }
        console.log('Main decremented: %s', i);
      });    
  });

  eventRegister.on('stockHistory', function(data, isDone){
    //Create a stock record for each requested stock down drug item
    var sh = new StockHistory();
    console.log(data);
    sh.log(data, data.forLocation, data.forLocation.options, function(r){
        isDone(data);
    });   
  });

  eventRegister.on('destUpdate', function(data, isDone){
    var sc_self = this;

    var destLocation = {
      id : location.destination.id,
      name: location.destination.name,
      options: location.destination.options
    };

    //Fix in the transactionId into options
    destLocation.options.transactionId = data.currentTransaction.id;

    var destUpdate = mongoose.model("StockCount");
    // Create or update this locations stock count
    // by adding / incrementing the amount to its stock
    destUpdate.update({
      item: data.id,
      $or:[{
          locationName : destLocation.name
        },{
          locationId: destLocation.id
        }],
       pendingTransactions: { $ne : data.currentTransaction.id}
      },{
        $inc: {
          amount: data.amount
        },
        //pushing this transactions id into the 
        //pending transaction's array serves as a check
        //if this trasaction for any reason becomes a duplicate
        //or is repeated. Possibly because of failure, the presence
        //of this value will provide the admin with options to rollback
        //or disallow a repeat transaction.        
        $push:{
          pendingTransactions: data.currentTransaction.id
        }
      }, function(err, i){
        if(err){
          return isDone(err);
        }
        if(i === 0){
          console.log('update results: '+i);
          var stockcount = new StockCount(data);
          stockcount.item = data.id;
          stockcount.locationId = data.currentTransaction.destination.id;
          stockcount.locationName = data.currentTransaction.destination.name;
          stockcount.pendingTransactions.push(data.currentTransaction.id);
          stockcount.save(function(err, i){
            if(err){
              return isDone(err);
            }else{
              data.forLocation = destLocation;
              isDone(data);
            }
          });
        }else{
          data.forLocation = destLocation;
          isDone(data);
        }
      }, true); 
  });


  eventRegister.on('restock', function(data, isDone, self){
      //Repeats theses events on every element in data.
      self.until(data, [
        //Inserts a transaction record and status to 'initial'
        'initial',
        //Makes the transaction pending
        'pending',
        'stockAvailability',
        //Where the stock is coming from
        'sourceUpdate',
        'stockHistory',
        //Where its going to
        'destUpdate',
        'stockHistory',
        'commit',
        'cleanPendingSource',
        'cleanPendingDest',
        'done'
        ], function(r){
          isDone(r);
      });
 
  });

  eventRegister.on('order', function(data, isDone, self){
    //Repeats theses events on every element in data.
    self.until(data, [
      //Inserts a transaction record and status to 'initial'
      'initial',
      //Makes the transaction pending
      'pending',
      //In this case stock is being 
      //added to the main stock
      'destUpdate',
      'stockHistory',
      'commit',
      'cleanPendingDest',
      'done'
      ], function(r){
        isDone(r);
    });
  });
  eventRegister.on('dispense', function(data, isDone, self){
    //Repeats theses events on every element in data.
    self.until(data, [
      //Inserts a transaction record and status to 'initial'
      'initial',
      //Makes the transaction pending
      'pending',
      //Check if that amount can be deducted
      'stockAvailability',
      //Stock is being taken from the souce location so
      'sourceUpdate',
      'stockHistory',
      'commit',
      'cleanPendingSource',
      'done'
      ], function(r){
        isDone(r);
    });
  });

  eventRegister
  .queue(operation)
  .onError(function(err){
    callback(err);
  })
  .onEnd(function(d){
    callback(d);
  })
  .start(reqObject);
};

/**
 * count Counts items for the summery tiles on the dashboard
 * @param  {[type]} callback [description]
 * @return {[type]}     [description]
 */
StockController.prototype.count = function(id, cb){
  var register = new EventRegister();

  register.once('getAllCount', function(data, isDone){
    Item.count({}, function(err, y){
      data.totalCount = y;
      isDone(data);
    });
  });

  register.once('getLowCount', function(data, isDone){
    StockCount.count({})
    .$where(function(){
      return this.amount < this.itemBoilingPoint;
    })
    .exec(function(err, i){
      if(err){
        isDone(err);
      }else{
        data.lowCount = i;
        isDone(data);
      }
    });
  });

  register
  .queue('getAllCount', 'getLowCount')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(i){
    cb(i);
  })
  .start({});

};


/**
 * Updates an items boiling point.
 * @param  {[type]}   locationId [description]
 * @param  {[type]}   itemId     [description]
 * @param  {[type]}   BP         [description]
 * @param  {Function} cb         [description]
 * @return {[type]}              [description]
 */
StockController.prototype.updateBP = function(locationId, itemId, BP, cb){
  StockCount.update({
    item: itemId,
    locationId: locationId
  }, {
    $set : {
      itemBoilingPoint: BP
    }
  }, function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  })
}


/**
 * history Fetches item stock history.
 * @param  {[type]}   item_Id item to query history for
 * @param  {String} date      Period to query history for
 * @param  {Function} cb      [description]
 * @return {[type]}           [description]
 */
StockController.prototype.history = function (item_Id, location, date,  cb){
  //regex for a valid ObjectId
  var reg = /^[0-9a-fA-F]{24}$/;

  var options = null;
  if(reg.test(location)){
    options = {"locationId": location};
  }else{
    options = {"locationName": location};
  }
  options.item = item_Id;

  //Checks if a date query is necessary
  // if(date){
  //   var start = new Date(date.start);
  //   var end = new Date(date.end);
  //   options.date = {$gte: start, $lt: end};
  // }

  console.log(options);
  StockHistory.find(options)
  .sort({date: -1})
  .populate('item', 'itemName')
  .exec(function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  });
};

/**
 * Updates the boiling point of an item
 * @param  {[type]}   id       Item Object Id
 * @param  {[type]}   bp       Boiling point to be set
 * @param  {[type]}   location LocationId for the Item
 * @param  {Function} cb       [description]
 * @return {[type]}            [description]
 */
StockController.prototype.updateBp = function(id, bp, location, cb){
  console.log(arguments);
    StockCount.update({
      item: id,
      locationId: location
    }, {
      $set: {
        itemBoilingPoint: bp
      }
    }, function(err, i){
      console.log(err, i);
      // if(err){
      //   cb(err);
      // }else{
      //   cb(i);
      // }
      cb(i);
    });
};

/**
 * Updates a stock down record property(ies) like name, 
 * staff in charge.
 * @param  {ObjectId} location_id [description]
 * @param  {Object}   props       Propeties to be updated
 * @param  {Function} cb          [description]
 * @return {[type]}               [description]
 */
StockController.prototype.updateStockDown = function(location_id, props, cb){
  PointLocation.update({
    _id: location_id
  },props, function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  }, true);
};


module.exports.manager = StockController;

var sc = new StockController();

module.exports.routes = function(app){
  //Stock down view
  app.get('/stock/locations',function(req, res){
    res.render('index',{
      title: 'Stock Down Points'
    });
  });

  //Create a stock down location
  app.post('/api/stock/location', function(req, res, next){
    sc.createLocation(req.body, function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });


  // Process stockdown request
  app.post('/api/stock/stockdown', function(req, res, next){
    // var options = {
    //   action: 'Requested Stock',
    //   reference: 'stockdown-'+ Date.now()
    // };
    var timenow = Date.now();
    var location = {
      origin: {
        id: req.body.location.origin._id,
        name: req.body.location.origin.locationName
      },
      destination: {
        id: req.body.location.destination._id,
        name: req.body.location.destination.locationName
      },
    }
    //Set Options
    location.origin.options = {
      action: 'Requested Stock (Origin)',
      reference: 'stockdown-'+ timenow      
    }
    location.destination.options = {
      action: 'Requested Stock (Destination)',
      reference: 'stockdown-'+timenow
    }
    sc.stocking(req.body.request, location, 'restock', function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }        
    });
  });

  // Get stock down records for a location
  app.get('/api/stock/location/:locationId', function(req, res, next){
    sc.getStockDown(req.param('locationId'), function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }         
    });
  });

  // Edits a stock down record property e.g. name
  app.put('/api/stock/location/:locationId', function(req, res, next){
    sc.updateStockDown(req.param('locationId'), req.body, function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }         
    });
  });



  //Dashboard Count Items
  app.get('/api/stock/count',function(req, res, next){
    sc.count(null, function(l){
      if(util.isError(l)){
        next(l);
      }else{
        res.json(200, {"count": l.totalCount, "low": l.lowCount});
      }
      
    });
  });

  // get all stock down locations and basic information
  app.get('/api/stock/location', cors, function(req, res, next){
    sc.getAllLocations(req.query.type, function(r){
        if(util.isError(r)){
            next(r);
        }else{
          res.json(200, r);
        }
    });
  });

  //Stock history for an item by location
  app.get('/api/items/:itemId/location/:location/history', function(req, res, next){
    sc.history(req.params.itemId, req.params.location, req.query.date,  function(r){
      if(util.isError(r)){
          next(r);
      }else{
          res.json(200, r);
      }
    });
  });
  //Updates the boiling point of an item on a location
  app.put('/api/items/:itemId/location/:location', function(req, res, next){
    sc.updateBp(req.params.itemId, req.body.bp, req.params.location, function(r){
      if(util.isError(r)){
          next(r);
      }else{
        res.json(200, true);
      }
    });
  });
};