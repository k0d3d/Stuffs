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
    EventRegister = require('./event_register').register,
    Admin = require('../app/controllers/admin').admin,
    nconf = require('nconf'),
    utils = require("util");


function _setMainLocation(){
    var admin = new Admin();
    // This method will check for a main location
    // or create one if it doesnt exist already.
    // its callback will attach the location ObjectId 
    // to our config instance.
    admin.createMainLocation(function(r){
        nconf.set("app:main_stock_id", r._id.toString());
        console.log('Set Main Location Id: '+ nconf.get("app:main_stock_id") );
    });
}

module.exports = function(){
    //Run Set location function
    _setMainLocation();
}