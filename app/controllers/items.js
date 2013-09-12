
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    Order = mongoose.model('Order'),
    Pharmacy = mongoose.model('Pharmacy'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    _ = require("underscore"),
    utils = require("util");


function sortItems (list,justkeys){
  var k = {}, l=[];
  list.forEach(function(ele,index,array){
    var fchar = ele.itemName.split("");
    l.push(fchar[0].toUpperCase());
  });
  if(justkeys){
    return l;
  }else{
    //o.push(k);
    return list;
  }
}


/**
 * Create an order
 */

var create = function (req, res) {
  var it = new Item(req.body.item);
  ObjectId = mongoose.Types.ObjectId;
  supplierObj = {};
  if(req.body.item.itemSupplier){
    var sn = req.body.item.itemSupplier.supplierName || '';
    supplierObj = {supplierName: sn};
  }
  if(req.body.item.orderInvoiceData !== undefined){
    console.log('not');
    var order = new Order();
    itemObj = {itemName: req.body.item.itemName};
    order.itemData.push(itemObj);
    order.orderSupplier.push(supplierObj);
    order.orderInvoice = req.body.item.orderInvoiceData.orderInvoiceNumber;
    order.orderStatus = 'Supplied'            ;
    order.orderType = req.body.item.itemType;
    order.orderAmount= req.body.item.orderInvoiceData.orderInvoiceAmount;
    order.orderDate= req.body.item.orderInvoiceDate;
    order.save(function(err){
      if(err)console.log(err);
    })
    it.currentStock = req.body.item.orderInvoiceData.orderInvoiceAmount;
  }
  it.save(function (err) {
    if (!err) {
      var s = Item.findOne({"_id": it._id});
      s.select('itemID itemName itemCategory');
      s.exec(function(err, item){
        res.writeHead(200,{'Content-Type': 'application/json'});
        res.write(JSON.stringify(item));
        res.end();
      });
    }else{
      console.log(err);
    }
  });
};
/**
 * List
 */

var list = function(req, res){

  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 30;
  var options = {
    "fields": "itemID itemName itemCategory itemBoilingPoint"
  };
  Item.list(options, function(err, r) {
    if (err) return res.json('500',{"mssg": 'Darn Fault!!!'});
    /**
     * Gets the current stock for all items in the inventory
     */
    var listofItems = [];
    _.each(r, function(value, index, pink){
      StockHistory.mainStockCount(value._id, function(stock){
        var it = {
          itemID: value.itemID,
          itemName: value.itemName,
          itemPurchaseRate: value.itemCategory,
          itemBoilingPoint: value.itemBoilingPoint,
          currentStock: (stock === null)? 0 : stock.amount,
        };
        listofItems.push(it);
        if(index + 1 === pink.length) res.json(200, listofItems);
      });
    });

  });
};

var listOne = function(req,res){
  var options = {criteria: {}, fields: {}};
  var reg = /^\d+$/;
  if(req.param('id').length > 0){
    if(reg.test(req.param('id'))){
      options.criteria = {"itemID": req.param('id')};
    }else{
      options.criteria = {"itemName": req.param('id')};
    }
    if(req.param('option') == 'quick'){
      options.fields = " _id itemID itemName sciName manufacturerName itemSupplier.supplierName itemPurchaseRate itemBoilingPoint";
    }
    Item.listOne(options, function(err, r){
      //console.log(itemsResult);
      if (err) return res.json('500',{"mssg": 'Darn Fault!!!'});
      /**
       * Get the current stock and last order date and 
       * add it to the object.
       */
      StockHistory.mainStockCount(r._id, function(stock){
        var it = {
          _id: r._id,
          itemID: r.itemID,
          itemName: r.itemName,
          sciName: r.sciName,
          manufacturerName: r.manufacturerName,
          itemPurchaseRate: r.itemPurchaseRate,
          itemBoilingPoint: r.itemBoilingPoint,
          currentStock: (stock === null)? 0 : stock.amount,
          lastSupplyDate: (stock === null)? '' : stock.date
        };
        res.json(200, it);
      });
    });
  }
};

var typeahead = function(req, res){
  var term = req.param('term');
  var needle = req.param('needle');
  //options.criteria[term] = '/'+needle+'/i';
  Item.autocomplete(needle, function(err,itemsResult){
    if (err) return res.render('500');
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.write(JSON.stringify(itemsResult));
     res.end();
  });
};

var count = function(req, res){
  var d = Item.count();
  var m  = Item.count();
  m.$where(function(){return this.currentStock < this.itemBoilingPoint && this.currentStock > 0;});
  var r = {};
  d.exec(function(err,y){
    if(err)console.log(err);
    m.exec(function(err, o){
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({"count":y,"low":o}));
      res.end();
    });
  });
};

var createLocation = function(req, res){
  var pl = new PointLocation(req.body);
  pl.save(function(err, saved){
    if(err) return err;
    var s = {
      locationAuthority: saved.locationAuthority,
      locationBoilingPoint: saved.locationBoilingPoint,
      locationId: saved.locationId,
      locationName: saved.locationName
    };
    res.json(s);
  });
};

var getAllLocations = function(req, res){
  PointLocation.list(function(err, r){
    if(err) return err;
    res.json(r);
  });
};

var dispenseThis = function(req, res){
  var ds = new Pharmacy(req.body);
  //If this order gets supplied.

  //Get the location to dispense from
  var location = {
    id : req.body.location._id,
    name: req.body.location.locationName
  };
  
  var stockhistory = new StockHistory();
  _.each(req.body.drugs , function(value, index){
    console.log(value);
    var obj = {
      item : value._id,
      action: 'Dispense'
    },
    amount = value.amount;

    StockHistory.lookup(value._id, location.id, function(deets){
      console.log(deets);
      obj.amount = (deets.amount - amount);
      stockhistory.decreaseStock(obj, location, function(status){
        console.log('status %s', status);
      });
    });
  });


  res.json(400,req.body);
};

var stockDown = function(req, res){
  //If this order gets supplied.
  return;
  var location = {
    id : req.body.location._id,
    name: req.body.location.locationName
  };
  
  function decreaseStock(list){
    //Get the current stock amount
    var q = StockHistory.findOne({item: list._id, locationName: 'Main'});
    q.sort({date: -1});
    q.limit(1);
    q.exec(function(err, i){
      var stockhistory = new StockHistory();
      //Save an initial reduced amount on Main Inventory
      stockhistory.item = list._id;
      stockhistory.locationName = 'Main';
      stockhistory.amount = i.amount - list.amount;
      stockhistory.action = 'Stock Down';
      stockhistory.save(function(err, i){
        var sh = new StockHistory();
        console.log(i);
        //Save a updated
        sh.item = list._id;
        sh.locationId = location.id;
        sh.locationName = location.name;
        sh.amount = list.amount;
        sh.action = 'Requested Stock';
        sh.save(function(err, i){
          res.json(200, {});
        });        
      });
    });  
  }  

  _.each(req.body.request , function(value, index){
    decreaseStock(value);
  });
};

var updateItem = function(req, res){
  //console.log(req.body);
  var itemId = req.body.itemID;
  var o = _.omit(req.body, ["_id", "itemID"]);
  console.log(o);
  Item.update({itemID: itemId}, {
    $set: o
  }, function(err, i){
    if(err){
      res.json(400,{});
    }else{
      res.json(i);
    }
  });
};

var getStockDown = function (req, res){
  StockHistory.fetchStockDownRecordbyId(req.param('locationId'), function(v){
    res.json(200,v);
  });
};

module.exports.routes = function(app){
  app.get('/items/index', function(req, res){
      res.render('items/index');
    });
  app.get('/items', function(req, res){
      res.render('index',{
        title: 'All Items'
      });
    });
  //Item routes   
  app.get('/items/add',function(req,res){
    res.render('index', {
      title: 'New Inventory Item',
    });
  });
  app.get('/items/:itemId/edit',function(req,res){
    res.render('index', {
      title: 'Update Item',
    });
  });
  app.get('/items/locations',function(req, res){
    res.render('index',{
      title: 'Stock Down Points'
    });
  });
  app.get('/items/dispensary',function(req, res){
    res.render('index',{
      title: 'Dispense Drugs'
    });
  });

  /**
  *Items Routes
  */
  //List all Items 
  app.get('/api/items/listAll',list);

  //app.get('/api/items/listOne/:id/:option',listOne);

  //Fetches data on an item, either full or summary
  app.get('/api/items/:id/options/:option',listOne);

  //Updates an Item
  app.post('/api/items/:id/edit',updateItem);

  //Typeahead Route
  app.get('/api/items/typeahead/term/:term/query/:needle',typeahead);

  //Dashboard Count Items
  app.get('/api/items/count',count);

  // get all stock down locations and basic information
  app.get('/api/items/location',getAllLocations);

  //Create a new Item 
  app.post('/api/items',create);

  //Create a stock down location
  app.post('/api/items/location',createLocation);

  //Creates a new record for a prescription
  app.post('/api/items/dispense', dispenseThis);

  // Process stockdown request
  app.post('/api/items/stockdown', stockDown);

  // Get stock down records for a location
  app.get('/api/items/stockdown/:locationId', getStockDown);
};