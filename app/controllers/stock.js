/**
 * Stock Controller Class
 * Module Dependcies
 */
var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    ItemCategory = mongoose.model('ItemCategory'),
    ItemForm = mongoose.model('ItemForm'),
    ItemPackaging = mongoose.model('ItemPackaging'),
    Order = mongoose.model('Order'),
    OrderStatus = mongoose.model('OrderStatus'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    _ = require("underscore"),
    NafdacDrugs = mongoose.model("nafdacdrug"),
    util = require("util");


function StockController (){

}

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

StockController.prototype.getAllLocations = function(callback){
  PointLocation.list(function(err, r){
    if(err) return callback(err);
    callback(r);
  });
};


/**
 * [getStockDown description]
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
 * [stockDown Handles Stock Down Operation]
 * @param  {[type]} obj [description]
 * @param  {[type]} callback [description]
 * @return {[type]}     [description]
 */
StockController.prototype.stockDown = function(obj, callback){
  //Using different model instances for updates
  var mainUpdate = mongoose.model("StockCount");
  var locationUpdate = mongoose.model("StockCount");
  var sh = new StockHistory();
  //If this order gets supplied.
  var location = {
    id : obj.location._id,
    name: obj.location.locationName
  };

  //Create a stock record for each requested stock down drug item
  function create_record(itemObj, cb){
    var others = {
          action: 'Requested Stock',
          reference: 'stockdown-'+ Date.now()
    };
    sh.log(itemObj, location, others, function(r){
      if(util.isError(r)){
        callback(r);
      }else{
        cb(r);
      }
    });
  }

  
  
  var total = obj.request.length, result= [];

  function saveAll (){
    var record = obj.request.pop();

    // Call the create_record function
    create_record({id: record._id, amount: record.amount}, function(p){
      //Deducts the amount from each items stock count.
      //Important:: Stock down means decrementing the 
      //amount from the main stock count
      mainUpdate.update({
        item: p.item,
        locationName : 'Main'
        },{
          $inc: {
            amount: -p.amount
          }
        }, function(err, i){
            if(err) return callback(err);
          //console.log('Main decremented: %s', i);
        });

      // Create or update this locations stock count
      // After iteration is complete. 
      locationUpdate.update({
        item: p.item,
        $or:[{
            locationName : location.name
          },{
            locationId: location.id
          }]
        },{
          $inc: {
            amount: p.amount
          }
          // //Setting last order / requested date
          // $set: {
          //   lastOrderDate: Date.now
          // }
        }, function(err, i){
          if(err){
            return callback(err);
          }
          if(i === 0){
            var stockcount = new StockCount(p);
            stockcount.save(function(err, i){
              if(err) return callback(err);
            });
          }else{
          }
        }, true);      
      if(--total){
        saveAll();
      }else{
        return callback(true);
      }
    });
  }
  saveAll();
};


/**
 * [count Counts items for the summery tiles on the dashboard]
 * @param  {[type]} callback [description]
 * @return {[type]}     [description]
 */
StockController.prototype.count = function(callback){
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
    StockCount.find({locationName: 'Main'}, function(err, i){
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
 * [history Fetches item stock history]
 * @param  {[type]}   item_Id [description]
 * @param  {Function} cb      [description]
 * @return {[type]}           [description]
 */
StockController.prototype.history = function (item_Id, location,  cb){
  StockHistory.find({item: item_Id, locationName: location})
  .sort({date: -1})
  .exec(function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  });
};

module.exports.item = StockController;

var sc = new StockController();

module.exports.routes = function(app){
  //Create a stock down location
  app.post('/api/items/location', function(req, res, next){
    sc.createLocation(req.body, function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });


  // Process stockdown request
  app.post('/api/items/stockdown', function(req, res, next){
    sc.stockDown(req.body, function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }        
    });
  });

  // Get stock down records for a location
  app.get('/api/items/stockdown/:locationId', function(req, res, next){
    sc.getStockDown(req.param('locationId'), function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }         
    });
  });

  //Dashboard Count Items
  app.get('/api/items/count',function(req, res){
    sc.count(function(lowCount, totalCount){
      res.json(200, {"count": totalCount, "low": lowCount});
    });
  });

  // get all stock down locations and basic information
  app.get('/api/items/location',function(req, res, next){
    sc.getAllLocations(function(r){
        if(util.isError(r)){
            next(r);
        }else{
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "X-Requested-With");              
          res.json(200, r);
        }
    });
  });

  app.get('/api/items/:itemId/location/:location/history', function(req, res, next){
    sc.history(req.params.itemId, req.params.location, function(r){
      if(util.isError(r)){
          next(r);
      }else{
          res.json(200, r);
      }
    });
  });
};