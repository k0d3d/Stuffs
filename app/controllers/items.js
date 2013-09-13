
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    Order = mongoose.model('Order'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
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
      StockCount.mainStockCount(value._id, function(stock){
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
  var it ={};
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
       * Since dispensing is carried out from a stockdown location,
       * we pass in the location object when fetching stock amount
       */
      if(req.param('locationId') === 'main'){
        //Get Stock count by name
        StockCount.getStockAmountbyId(r._id,{name: 'Main'} ,function(stock){
          console.log(stock);
          it = {
            _id: r._id,
            itemID: r.itemID,
            itemName: r.itemName,
            sciName: r.sciName,
            manufacturerName: r.manufacturerName,
            itemPurchaseRate: r.itemPurchaseRate,
            itemBoilingPoint: r.itemBoilingPoint,
            currentStock: (stock === null)? 0 : stock.amount,
            lastSupplyDate: (stock === null)? '' : stock.lastOrderDate
          };
          res.json(200, it);
        });
      }else{
        //Get stock count by location id
        StockCount.getStockAmountbyId(r._id,{id: req.param('locationId')} ,function(stock){
          console.log(stock);
          it = {
            _id: r._id,
            itemID: r.itemID,
            itemName: r.itemName,
            sciName: r.sciName,
            manufacturerName: r.manufacturerName,
            itemPurchaseRate: r.itemPurchaseRate,
            itemBoilingPoint: r.itemBoilingPoint,
            currentStock: (stock === null)? 0 : stock.amount,
            lastSupplyDate: (stock === null)? '' : stock.lastOr
          };
          console.log(it);
          res.json(200, it);
        });
      }
    });
  }
};

/**
 * [typeahead description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var typeahead = function(req, res){
  var term = req.param('term');
  var needle = req.param('needle');
  //options.criteria[term] = '/'+needle+'/i';
  Item.autocomplete(needle, function(err,itemsResult){
    if (err) return res.render('500');
     res.json(itemsResult);
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

/**
 * [dispenseThis description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var dispenseThis = function(req, res){
  var dispense = new Dispense();
  var bill = new Bill();
  var drugslist = [];

  //Get the location to dispense from
  var location = {
    id : req.body.location._id,
    name: req.body.location.locationName
  };
  
  //Saves a dispense record
  function saveDispenseRecord(){
    dispense.patientName = req.body.patientName;
    dispense.patientId =  req.body.patientId;
    dispense.company = req.body.company;
    dispense.locationId = location.id;
    dispense.save(function(err, i){
      if(err){
        console.log(err);
      }else{
        saveBillRecord();
      }
    });
  }

  //Saves a bill record
  function saveBillRecord(){
    bill.dispenseID = dispense._id;
    bill.patientName = req.body.patientName;
    bill.patientId =  req.body.patientId;    
    bill.save(function(err, i){
      if(err) res.json('500',{"message": err});
      res.json(200, {});
    })
  }

  //Create a stock record for each dispensed drug item
  function create_record(itemObj, cb){
    var stockhistory = new StockHistory();
    stockhistory.item = itemObj.id;
    stockhistory.locationId = location.id;
    stockhistory.locationName = location.name;
    stockhistory.amount = itemObj.amount;
    stockhistory.action = 'Dispense';
    stockhistory.reference = 'dispense-'+dispense._id;
    stockhistory.save(function(err, i){
      cb(i);
    });

  }

  var total = req.body.drugs.length, result= [];

  function saveAll (){
    var request = req.body.drugs;
    var record = request.pop();

    // Call the create_record function
    create_record({id: record._id, amount: record.amount}, function(p){
      // Create or update this locations stock count
      StockCount.update({
        item: p.item,
        $or:[{
            locationName : location.name
          },{
            locationId: location.id
          }]
        },{
          $inc: {
            amount: -p.amount
          }
        }, function(err, i){
          if(err){
            if(err) res.json(400, {"message": err});
          }
        }, true);
      // Push the drugs into dispense.drugs instance array
      dispense.drugs.push({
        itemID: record._id,
        amount: record.amount,
        status: record.status
      });      
      if(--total){
        saveAll();
      }else{
        saveDispenseRecord();
      }
    });
  }
  saveAll();
};

/**
 * [stockDown Handles Stock Down Operation]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var stockDown = function(req, res){
  //Using different model instances for updates
  var mainUpdate = mongoose.model("StockCount");
  var locationUpdate = mongoose.model("StockCount");

  //If this order gets supplied.
  var location = {
    id : req.body.location._id,
    name: req.body.location.locationName
  };

  //Create a stock record for each dispensed drug item
  function create_record(itemObj, cb){
    var stockhistory = new StockHistory();
    stockhistory.item = itemObj.id;
    stockhistory.locationId = location.id;
    stockhistory.locationName = location.name;
    stockhistory.amount = itemObj.amount;
    stockhistory.action = 'Requested Stock';
    stockhistory.reference = 'none';
    stockhistory.save(function(err, i){
      cb(i);
    });

  }

  
  
  var total = req.body.request.length, result= [];

  function saveAll (){
    var request = req.body.request;
    var record = request.pop();

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
          if(err){
            if(err) res.json(400, {"message": err});
          }
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
            if(err) res.json(400, {"message": err});
          }
          if(i === 0){
            var stockcount = new StockCount(p);
            stockcount.save(function(err, i){
              if(err) res.json(400, {"message": err});
            });
          }else{
          }
        }, true);      
      if(--total) saveAll();
      else res.json(200, {});
    });
  }
  saveAll();
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
  StockCount.fetchStockDownRecordbyId(req.param('locationId'), function(v){
    res.json(200,v);
  });
};

var getDispenseRecord = function(req, res){
  var q  = Dispense.find();
  q.populate('locationId');
  q.sort({issueDate: -1});
  q.exec(function(err, i){
    res.json(200, i);
  });
}

var getBills = function(req, res){
  var q  = Bill.find();
  q.populate('dispenseID');
  q.sort({billedOn: -1});
  q.exec(function(err, i){
    res.json(200, i);
  });  
}

var itemFields = function (req, res){
  var options = {criteria: {}, fields: {}};
  var reg = /^\d+$/;
  if(req.param('itemId').length > 0){
    if(reg.test(req.param('itemId'))){
      options.criteria = {"itemID": req.param('itemId')};
    }else{
      options.criteria = {"itemName": req.param('itemId')};
    }

    Item.findOne(options.criteria, function(err, r){
      //console.log(itemsResult);
      if (err) return res.json('500',{"mssg": 'Darn Fault!!!'});
      console.log(r);
      res.json(r);
    });
  }
}

module.exports.routes = function(app){

  app.get('/items', function(req, res){
      res.render('index',{
        title: 'All Items'
      });
    });
  app.get('/items/index', function(req, res){
      res.render('items/index');
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

  //Move this route to seperate file
  app.get('/bills', function(req, res){
      res.render('index');
  });
  //Lookup all bills
  app.get('/api/bills', getBills);

  /**
  *Items Routes
  */
  //List all Items 
  app.get('/api/items/listAll',list);

  //app.get('/api/items/listOne/:id/:option',listOne);

  //Fetches data on an item, either full or summary by location
  app.get('/api/items/:id/options/:option/locations/:locationId',listOne);

  //Fetches data for an item when editing
  app.get('/api/items/:itemId/edit', itemFields );

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

  //Gets a prescription record by locationId
  app.get('/api/items/locations/records', getDispenseRecord);

  //Creates a new record for a prescription
  app.post('/api/items/dispense', dispenseThis);

  // Process stockdown request
  app.post('/api/items/stockdown', stockDown);

  // Get stock down records for a location
  app.get('/api/items/stockdown/:locationId', getStockDown);


};