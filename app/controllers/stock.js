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
 * the parent even 'stockDown' initiates a recusive event which calls a list 
 * of child events on the data 'obj' sent. 
 * @param  {[type]} obj contains the location to stockdown to, the stock down request 
 * @param  {[type]} callback [description]
 * @return {[type]}     [description]
 */
StockController.prototype.stockDown = function(obj, callback){

  var sc_self = this;
  //Inherited from transactions.
  //Loads the transaction model into 
  //the transModel property
  sc_self.initiate();
  //return ;
  
  var eventRegister = new EventRegister();

  var destLocation = {
    id : obj.location.destination._id,
    name: obj.location.destination.locationName
  };

  var originLocation = {
    id : obj.location.origin._id,
    name: obj.location.origin.locationName    
  };

  //Create a stock record for each requested stock down drug item
  function __createRecord(itemObj, cb){
    var sh = new StockHistory();

    var others = {
      action: 'Requested Stock',
      reference: 'stockdown-'+ Date.now()
    };
    sh.log(itemObj, destLocation, others, function(r){
      if(util.isError(r)){
        callback(r);
      }else{
        cb(r);
      }
    });
  }

  eventRegister.on('createRecord', function(data, isDone){
    //console.log('Im creating a record with:');

    // Call the create_record function on it
    __createRecord({id: data._id, amount: data.amount}, function(r){
      //console.log(r);

      // Pass the result to the next event
      isDone(r);
    });
  });

  eventRegister.on('initial', function(data, isDone){

    //Insert the new stock history record 
    //on the transaction model.
    sc_self.insertRecord(data, originLocation, destLocation, function(r){
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
  
  eventRegister.on('cleanPending', function(data, isDone){
    sc_self.cleanPending(StockCount, function(r){
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

  eventRegister.on('mainUpdate', function(data, isDone){
    // console.log('Im at main update with:');
    var sc_self = this;
    var originUpdate = mongoose.model("StockCount");

    
    //Deducts the amount from each items main stock count.
    //Important:: Stock down means decrementing the 
    //amount from the main stock count
    originUpdate.update({
      item: data.item,
      locationId : originLocation.id,
      //Checking / filtering with $ne ensures that
      //this particular transaction does not already 
      //exist
      pendingTransactions: data.currentTransaction.id
      
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
            isDone(data);
          }
        console.log('Main decremented: %s', i);
      });    
  });

  eventRegister.on('locationUpdate', function(data, isDone){
    var sc_self = this;

    var destUpdate = mongoose.model("StockCount");
    // Create or update this locations stock count
    // by adding / incrementing the amount to its stock
    destUpdate.update({
      item: data.item,
      $or:[{
          locationName : destLocation.name
        },{
          locationId: destLocation.id
        }]
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
          stockcount.save(function(err, i){
            if(err){
              return isDone(err);
            }else{
              isDone(data);
            }
          });
        }else{
          isDone(data);
        }
      }, true); 
  });

  eventRegister.on('stockDown', function(data, isDone, self){
      //Repeats theses events on every element in data.
      self.until(data, [
        //Inserts a transaction record and status to 'initial'
        'initial',
        //Makes the transaction pending
        'pending',

        'mainUpdate',
        'locationUpdate',
        'commit',
        'cleanPending',
        'createRecord',
        'done'
        ], function(r){
          isDone(r);
      });
 
  });


  eventRegister
  .queue('stockDown')
  .onError(function(err){
    callback(err);
  })
  .onEnd(function(d){
    callback(d);
  })
  .start(obj.request);
};


/**
 * count Counts items for the summery tiles on the dashboard
 * @param  {[type]} callback [description]
 * @return {[type]}     [description]
 */
StockController.prototype.count = function(id, callback){
  return callback(0, 0);
  var d = Item.count();
  var m  = Item.find();
  //m.$where(function(){return this.currentStock < this.itemBoilingPoint && this.currentStock > 0;});
  var r = {}, lowCount = 0, totalCount = 0, total, stockcountlist;
  d.exec(function(err,y){
    if(err)return callback(err);
    totalCount = y;
    gl();
  });

  //When set, please send respion
  function respond(lowCount, totalCount){
    callback(lowCount, totalCount);
  }

  //get all items from the 'items' collectioin
  function gl (){
    StockCount.find({locationId: id}, function(err, i){
      total = i.length;
      stockcountlist = i;
      if(stockcountlist.length === 0){
        respond(0, totalCount);
      }else{
        // Run the cross check function
        hl();
      }
    });
  }


  //Cross check the currentStock against the itemBoilingPoint
  //pass in the StockCount list
  function hl (){
    var countItem = stockcountlist.pop();
    //Find one 
    Item.load(countItem.item, function(err, i){
      //When found compare boilingPoint to the result amount
      if(countItem.amount < i.itemBoilingPoint){
        lowCount++;
      }
      --total;
      if(total > 0){
        hl();
        return;
      }else{
        respond(lowCount, totalCount);
      }
    });
  }
};

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
  if(date){
    var start = new Date(date.start);
    var end = new Date(date.end);
    options.date = {$gte: start, $lt: end};
  }

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
  StockCount.update({
    _id: id,
    locationId: location
  }, {
    boilingPoint: bp
  }, function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  }, true);
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

module.exports.stock = StockController;

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
    sc.stockDown(req.body, function(r){
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
  app.get('/api/stock/count',function(req, res){
    sc.count(null, function(lowCount, totalCount){
      res.json(200, {"count": totalCount, "low": lowCount});
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