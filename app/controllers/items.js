
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Item = mongoose.model('Item')


var mockItems = [{
  "itemID": "0001",
  "itemType": "Medication",
  "itemName": "Loxagyl 400",
  "sciName": "Metronidazole 400mg",
  "manufacturerName": "May & Baker",
  "itemCategory": "Antibiotic",
  "itemDescription": "None Available",
  "orderInvoiceData":[{"orderInvoiceNumber":20000,
                      "orderInvoiceDate":"01/01/2013",
                      "orderInvoiceAmount":"5013",
                      "orderBatchExpDate":"05/05/2015"
                    }],
  "itemSupplier": [{
    "supplierID": "0001",
    "supplierName": "May & Baker"
  }],
  "itemBoilingPoint":300,
  "packageSize":"10 x 10 ",
  "packageType": "Tablets",
  "itemRate": "375 / Box" ,  
  "currentStock": 0 
},
{
  "itemID": "0002",
  "itemType": "Medication",
  "itemName": "Fesoven",
  "sciName": "Griseofulvin 500mg",
  "manufacturerName": "Didek",
  "itemCategory": "Antibiotic",
  "itemDescription": "None Available",
  "orderInvoiceData":[{"orderInvoiceNumber":20000,
                      "orderInvoiceDate":"01/01/2013",
                      "orderInvoiceAmount":"5013",
                      "orderBatchExpDate":"05/05/2015"
                    }],
  "itemSupplier": [{
    "supplierID": "0001",
    "supplierName": "Didek"
  }],
  "itemBoilingPoint":300,
  "packageSize":"1 x 20",
  "packageType": "Tablets",
  "itemRate": "550 / Box",  
  "currentStock": 250  
},
{
  "itemID": "0003",
  "itemType": "Medication",
  "itemName": "DBD-Ampi",
  "sciName": "Ampicillin 250mg",
  "manufacturerName": "Didek",
  "itemCategory": "Antibiotic",
  "itemDescription": "None Available",
  "orderInvoiceData":[{"orderInvoiceNumber":20000,
                      "orderInvoiceDate":"01/01/2013",
                      "orderInvoiceAmount":"5013",
                      "orderBatchExpDate":"05/05/2015"
                    }],
  "itemSupplier": [{
    "supplierID": "0001",
    "supplierName": "Didek"
  }],
  "itemBoilingPoint":300,
  "packageSize":"10 x 10",
  "packageType": "Capsules",
  "itemRate": "300 / Box",  
  "currentStock": 1200  
},
{
  "itemID": "0004",
  "itemType": "Medication",
  "itemName": "Loxaprim",
  "sciName": "Sulphametoxazo 400mg - Trimtoprim 80mg",
  "manufacturerName": "May & Baker",
  "itemCategory": "Antibiotic",
  "itemDescription": "None Available",
  "orderInvoiceData":[{"orderInvoiceNumber":20000,
                      "orderInvoiceDate":"01/01/2013",
                      "orderInvoiceAmount":"5013",
                      "orderBatchExpDate":"05/05/2015"
                    }],
  "itemSupplier": [{
    "supplierID": "0001",
    "supplierName": "May & Baker"
  }],
  "itemBoilingPoint":300,
  "packageSize":"10 x 10",
  "packageType": "Capsules",
  "itemRate": "375 / Box",  
  "currentStock": 1200  
}
]

function itemSummary(itemData){

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
 * New order
 */

exports.add = function(req, res){
  res.render('items/new', {
    title: 'New Inventory Item',
    order: new Item({})
  })
}
/**
 * Create an order
 */

exports.create = function (req, res) {
  var it = new Item(req.body)

  it.save(function (err) {
    if (!err) {
      req.flash('success', 'Successfully Saved!')
    }
    console.log(err)
  })
}
/**
 * List
 */

exports.list = function(req, res){

  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30
  var options = {
  }
  Item.list(options, function(err, itemsResult) {
    if (err) return res.render('500')
    res.writeHead(200,{'Content-Type': 'application/json'})
    res.write(JSON.stringify(itemsResult));
    res.end();
  })
}
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

exports.listOne = function(req,res){
  var options = {criteria: {}};
  function _isNumber(fData){
      var reg = new RegExp("^[-]?[0-9]+[\.]?[0-9]+$");
      return reg.test(fData)
  }
  if(req.param('id').length > 0){
    if(_isNumber(req.param('id'))){
      options.criteria = {"itemID": req.param('id')}
    }else{
      options.criteria = {"itemName": req.param('id')}
    }
    Item.list(options, function(err, itemsResult){
      if (err) return res.render('500')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        
        if(req.param('summary') == 'quick'){
          d = itemsResult[0];
          rslt = {
            "name": d.itemName,
            "sciName": d.sciName,
            "manufacturerName": d.manufacturerName,
            "itemRate": d.itemRate
          }
          res.write(JSON.stringify(rslt)) 
        }else{
          res.write(JSON.stringify(itemsResult[0])) 
        }
        
        res.end();       
    })
  }    
}

exports.typeahead = function(req, res){
  var term = req.param('term');
  var needle = req.param('needle');
  //options.criteria[term] = '/'+needle+'/i';
  Item.autocomplete(needle, function(err,itemsResult){
    if (err) return res.render('500')
     res.writeHead(200, { 'Content-Type': 'application/json' })
     res.write(JSON.stringify(itemsResult)) 
     res.end();   
  })
}