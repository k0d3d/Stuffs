
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Item = mongoose.model('Item')


module.exports.routes = function(app){
  app.get('/items/index', function(req, res){
      res.render('items/index',{
        title: 'Dashboard'
      });
    });
  app.get('/items/list', function(req, res){
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
  app.get('/api/items/listAll',list);
  app.get('/items/listOne/:id/:summary',listOne) 
  app.get('/items/typeahead/:term/:needle',typeahead)
  app.post('/api/items',create)  
}

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
  var it = new Item(req.body);
  console.log(req.body);
  it.save(function (err) {
    if (!err) {
      res.send('success', 'Successfully Saved!');
    }
    console.log(err);
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
  })
}