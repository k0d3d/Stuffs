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

module.exports.routes = function(app){
  app.get('/admin',function(req, res){
    res.render('index',{
      title: 'Admin Area'
    });
  });

	
}