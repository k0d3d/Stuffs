
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Item = mongoose.model('Item');
    Order = mongoose.model('Order');
    Pharmacy = mongoose.model('Pharmacy');
    PointLocation = mongoose.model('Location');


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
    "fields": "itemID itemName currentStock itemCategory itemBoilingPoint"
  };
  Item.list(options, function(err, itemsResult) {
    if (err) return res.render('500');
    res.writeHead(200,{'Content-Type': 'application/json'});
    res.write(JSON.stringify(itemsResult));
    res.end();
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
    if(req.param('summary') == 'quick'){
      options.fields = "itemID itemName sciName manufacturerName itemSupplier.supplierName currentStock itemRate";
    }
    Item.list(options, function(err, itemsResult){
      if (err) return res.render('500');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(itemsResult[0]));
        res.end();
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
  var ds = new Dispense(req.body);

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
  app.get('/api/items/listAll',list);
  app.get('/api/items/listOne/:id/:summary',listOne);
  app.get('/api/items/typeahead/:term/:needle',typeahead);
  app.get('/api/items/count',count);
  // get all stock down locations and basic information
  app.get('/api/items/location',getAllLocations);
  app.post('/api/items',create);
  //create a stock down location
  app.post('/api/items/location',createLocation);
  app.post('/api/items/dispensary', dispenseThis);
};