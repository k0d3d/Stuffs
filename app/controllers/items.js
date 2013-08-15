
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Item = mongoose.model('Item');
    Order = mongoose.model('Order');


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
  app.get('/items/points',function(req, res){
    res.render('index',{
      title: 'Stock Down Points'
    });
  });
/**
 * Renders a list of created Stock Down Points
 * and the available inventory. You can also create new 
 * Points and perform simple management operations
 */
  app.get('items/stockpoints', function(req, res){
    res.render('items/stockdown',{
      title: 'Stock Down Points'
    });
  });
  app.get('/api/items/listAll',list);
  app.get('/api/items/listOne/:id/:summary',listOne);
  app.get('/api/items/typeahead/:term/:needle',typeahead);
  app.get('/api/items/count',count);
  app.post('/api/items',create);
};

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
  supplierObj = {supplierName: req.body.item.itemSupplier.supplierName};
  if(req.body.item.orderInvoiceData != undefined){
    console.log('not');
    var order = new Order();
    itemObj = {itemName: req.body.item.itemName};
    order.itemData.push(itemObj);
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
  it.itemSupplier.push(supplierObj);
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
// exports.list = function(req, res){

//   var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
//   var perPage = 30
//   var options = {
//   }
//   Item.list(options, function(err, itemsResult) {
//     if (err) return res.render('500')
//       console.log(sortItems(itemsResult));
//     res.render('items/listAll',{
//       title: 'All Inventory Items',
//       items: sortItems(itemsResult),
//       indexLttrs : sortItems(itemsResult,true),
//       inactiveLi : (function(){
//                     a = [];
//                     for (i=65;i<=90;i++){
//                         a[a.length] = String.fromCharCode(i);
//                     }
//                     return a;
//             }())
//     });
//   })
// }

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
