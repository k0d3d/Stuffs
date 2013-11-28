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
    utils = require("util");
/**
 * Module dependencies.
 */




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


function ItemsObject(){

}


ItemsObject.prototype.constructor = ItemsObject;

/**
 * Create an item
 */

ItemsObject.prototype.create = function (itemBody, callback) {
  // callback(200);
  // return;
  if(itemBody.item.length === 0){
    return callback(400);
  }
  //copy the item category property into a variable
  var shark = itemBody.item.itemCategory;

  //omit the itemCategory property
  var joel = _.omit(itemBody.item, "itemCategory");

  var it = new Item(joel);
  ObjectId = mongoose.Types.ObjectId;
  //supplierObj = {};
  // if(itemBody.item.suppliers){
  //   var sn = itemBody.item.suppliers.supplierName || '';
  //   supplierObj = {supplierName: sn};
  // }

  //Push in categories
  //var c = [];
  _.each(shark, function(v,i){
    it.itemCategory.push(v._id);
  });

  //Create a new order if the invoice number was entered
  if(itemBody.item.orderInvoiceData !== undefined){
    
    //Creates a new order.
    var order = new Order();
    itemObj = {itemName: itemBody.item.itemName};
    order.itemData.push(itemObj);
    order.orderSupplier = (itemBody.item.suppliers);
    order.orderInvoice = itemBody.item.orderInvoiceData.orderInvoiceNumber;
    order.orderStatus = 'Supplied'            ;
    order.orderType = itemBody.item.itemType;
    order.orderAmount= itemBody.item.orderInvoiceData.orderInvoiceAmount;
    order.orderDate= itemBody.item.orderInvoiceDate;
    order.save(function(err){
      if(utils.isError(err))return callback(err);
    });

    //Updates the order statuses, these are useful for order history
    //queries, etc.
    var doOrderStatusUpdates = function (){
        //Creates a new record to show when this order was
        //updated and what action was taken.
        orderstatus = new OrderStatus();
        orderstatus.status = 'Supplied';
        orderstatus.order_id = order._id;
        orderstatus.save(function(err){
          if(err)return err;
          callback(200);
        });
    };

    //Set the location to 'Main'
    var location ={
      name: 'Main'
    };

    var stockhistory = new StockHistory();
    // Check if this record has been created for this order using the orderid and the reference field 
    // on the StockHistoryShema
    StockHistory.count({'reference': 'create-'+req.params.orderId}, function(err, count){
      if(count > 0){
        callback(400);
      }else{
        var itemObj = {
          id: req.body.itemData._id,
          amount: req.body.amount
        };
        var options = {
          action: 'Stock Up',
          reference: 'create-'+req.param('orderId')
        };
        //Create a stock history record.
        stockhistory.log(itemObj, location, options ,function(g){
          // Creates a stock count for the item 
          var stockcount = new StockCount(g);
          stockcount.amount = itemBody.item.orderInvoiceData.orderInvoiceAmount;
          stockcount.save(function(err, i){
            doOrderStatusUpdates();
          });
        });
      }
    });
  }

  it.save(function (err) {
    if (!err) {
      var s = Item.findOne({"_id": it._id});
      s.select('itemID itemName itemCategory');
      s.exec(function(err, item){
        callback(item);
      });
    }else{
      callback(err);
    }
  });
};


/**
 * List
 */

ItemsObject.prototype.list = function(req, res){

  var options = {
    "fields": "itemName itemCategory itemBoilingPoint"
  };
  Item.list(options, function(err, r) {
    if (err) return res.json('500',{"mssg": 'Darn Fault!!!'});
    /**
     * Gets the current stock for all items in the inventory
     */
    var listofItems = [];
    var x = r.length;
    //msc means main stock count, #humorMe
    function mscProcess(){
      if(x === 0){
        return res.json(200, {});
      }
      var _item = r.pop();
      StockCount.mainStockCount(_item._id, function(stock){
        var it = {
          _id: _item._id,
          itemName: _item.itemName,
          itemBoilingPoint: _item.itemBoilingPoint,
          itemCategory: _item.itemCategory,
          currentStock: (stock === null)? 0 : stock.amount,
        };
        listofItems.push(it);

        if(--x){
          mscProcess();
        }else{
          res.json(200, listofItems);
        }
      });
    }

    mscProcess();

  });
};


/**
 * [listOne Does a summary thingy fetch]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.listOne = function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  var options = {criteria: {}, fields: {}};
  var it ={};
  var reg = /^[0-9a-fA-F]{24}$/;
  if(req.param('id').length > 0){
    if(reg.test(req.param('id'))){
      options.criteria = {"_id": req.param('id')};
    }else{
      options.criteria = {"itemName": req.param('id')};
    }
    if(req.param('option') == 'quick'){
      //options.fields = " _id itemID itemName sciName manufacturerName itemSupplier.supplierName itemPurchaseRate itemBoilingPoint";
      options.fields = "";
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
          it = {
            _id: r._id,
            itemID: r.itemID,
            itemName: r.itemName,
            sciName: r.sciName,
            manufacturerName: r.manufacturerName,
            itemPurchaseRate: r.itemPurchaseRate,
            itemBoilingPoint: r.itemBoilingPoint,
            itemForm: r.itemForm,
            itemPackaging: r.itemPackaging,
            packageSize: r.packageSize,
            suppliers : r.suppliers,
            currentStock: (stock === null)? 0 : stock.amount,
            lastSupplyDate: (stock === null)? '' : stock.lastOrderDate,
            nafdacId: r.nafdacId,
            nafdacRegNo: r.nafdacRegNo
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
            itemForm: r.itemForm,
            itemPackaging: r.itemPackaging,
            packageSize: r.packageSize,            
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
ItemsObject.prototype.typeahead = function(req, res){
  var term = req.param('term');
  var needle = req.param('needle');
  //options.criteria[term] = '/'+needle+'/i';
  Item.autocomplete(needle, function(err,itemsResult){
    if (err) return res.render('500');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");    
    res.json(itemsResult);
  });
};


/**
 * [nafdacTypeAhead description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.nafdacTypeAhead = function(req, res){
  var needle = req.param('needle');
  //options.criteria[term] = '/'+needle+'/i';
  NafdacDrugs.autocomplete(needle, function(err,itemsResult){
    if (err) return res.render('500');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");    
    res.json(itemsResult);
  });
};


/**
 * [updateItem description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.updateItem = function(req, res){
  var itemId = req.body._id;
  var category = [];
  _.each(req.body.itemCategory, function(v){
    category.push(v._id);
  });
  var o = _.omit(req.body, ["_id", "itemID", "itemCategory"]);
  o.itemCategory = category;
  Item.update({_id: itemId}, {
    $set: o
  }, function(err, i){
    if(err){
      res.json(400,err);
    }else{
      res.json(i);
    }
  });
};



/**
 * [itemFields used for querying an item document e.g. when editing / updating an item]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.itemFields = function (req, res){
  var options = {criteria: {}, fields: {}};
  var reg = /^[0-9a-fA-F]{24}$/;
  if(req.param('item_id').length > 0){
    if(reg.test(req.param('item_id'))){
      options.criteria = {"_id": req.param('item_id')};
    }else{
      options.criteria = {"itemName": req.param('item_id')};
    }

    Item.listOne(options, function(err, r){
      if (err) return res.json(500,{"mssg": 'Darn Fault!!!'});
      res.json(200, r);
    });
  }
};

/**
 * [deleteItem description]
 * @param  {Integer}   itemId   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.deleteItem = function(itemId, callback){
  Item.remove({_id: itemId}, function(err, i){
    if(utils.isError(err)){
      callback(err);
      return;
    }
    callback(i);
  });
};

/**
 * [addCategory Adds a new category for items]
 * @param {[type]}   name     [description]
 * @param {[type]}   parent   [description]
 * @param {Function} callback [description]
 */
ItemsObject.prototype.addCategory = function(name, parent, callback){
  if(name.length === 0 ){
    return callback(new Error('Empty name'));
  }
  if(parent.length === 0){
    parent = undefined;
  }
  var ic = new ItemCategory();
  ic.create(name, parent, function(r){
    callback(r);
  });
};

/**
 * [listCategory list out all saved categories]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.listCategory = function(callback){
  return ItemCategory.list(function(i){
    callback(i);
  });
};

/**
 * [addForm Adds an item form ]
 * @param {[type]}   name     [description]
 * @param {Function} callback [description]
 */
ItemsObject.prototype.addForm = function(name, callback){
  if(name.length === 0 ){
    return callback(new Error('Empty name'));
  }
  var ic = new ItemForm();
  ic.create(name, function(r){
    console.log(r);
    callback(r);
  });
};

/**
 * [listForm List all item forms]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.listForm = function(callback){
  return ItemForm.list(function(i){
    callback(i);
  });
};


ItemsObject.prototype.listPackaging = function(callback){
  return ItemPackaging.list(function(i){
    callback(i);
  });
};

ItemsObject.prototype.addPackaging = function(name, callback){
  if(name.length === 0 ){
    return callback(new Error('Empty name'));
  }

  var ic = new ItemPackaging();
  ic.create(name, function(r){
    callback(r);
  });  
};




module.exports.item = ItemsObject;

var item = new ItemsObject();

module.exports.routes = function(app){

  app.get('/items', function(req, res){
      res.render('index',{
        title: 'All Items'
      });
  });
  app.get('/items/index', function(req, res){
      res.render('items/index');
  });

  app.get('/items/view/low', function(req, res){
    res.render('index');
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




  /**
  *Items Routes
  */
  //List all Items 
  app.get('/api/items/listAll', item.list);

  //app.get('/api/items/listOne/:id/:option',listOne);

  //Fetches data on an item, either full or summary by location
  app.get('/api/items/:id/options/:option/locations/:locationId',item.listOne);

  //Fetches data for an item when editing
  app.get('/api/items/:item_id/edit', item.itemFields );

  //Updates an Item
  app.post('/api/items/:id/edit',item.updateItem);

  //Typeahead Route
  app.get('/api/items/typeahead/term/:term/query/:needle',item.typeahead);

  //Nafdac Typeahead Route
  app.get('/api/nafdacdrugs/typeahead/needle/:needle',item.nafdacTypeAhead);

  //Create a new Item 
  app.post('/api/items',function(req,res){
    item.create(req.body, function(result){
      if(result === 400){
        res.json(400,{"message": "Invalid Order"});
      }else if(result === 200){
        res.json(200, {"task": true});
      }else if(typeof(result) ==  'object'){
        res.json(200, {"task": true});
      }
    });
  });


  //Delete Item
  app.del('/api/items/:itemId', function(req, res){
    item.deleteItem(req.param('itemId'), function(i){
      res.json(200, {state: i});
    });
  });

  //Item Category Routes.///
  app.post('/api/items/category', function(req, res, next){
    item.addCategory(req.body.name, req.body.parent, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/category', function(req, res, next){
    item.listCategory(function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }      
    });
  });

  app.del('/api/items/category/:categoryId', function(req, res, next){
    var catId = req.params.categoryId;
    item.removeCategory(catId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, true);
      }       
    });
  });
  //Item Form Routes.///
  app.post('/api/items/form', function(req, res, next){
    item.addForm(req.body.name, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/form', function(req, res, next){
    item.listForm(function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }      
    });
  });

  app.del('/api/items/category/:form_id', function(req, res, next){
    var catId = req.params.form_id;
    item.removeForm(catId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, true);
      }       
    });
  });
  //Item Packaging Routes.///
  app.post('/api/items/packaging', function(req, res, next){
    item.addPackaging(req.body.name, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/packaging', function(req, res, next){
    item.listPackaging(function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }      
    });
  });

  app.del('/api/items/category/:package_id', function(req, res, next){
    var catId = req.params.package_id;
    item.removePackage(catId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, true);
      }       
    });
  });
};

