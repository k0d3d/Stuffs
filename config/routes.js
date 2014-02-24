
/*!
 * Module dependencies.
 */
var async = require('async');
var config = require('config');

/**
 * Route middlewares
 */


/**
 * Expose routes
 */

module.exports = function (app, passport) {
  // home route

  var items = require('../app/controllers/items');
  items.routes(app);
  var orders = require('../app/controllers/orders');
  orders.routes(app);
  var suppliers = require('../app/controllers/suppliers');
  suppliers.routes(app);
  var reports = require('../app/controllers/reports');
  reports.routes(app);
  var dispense = require('../app/controllers/dispense');
  dispense.routes(app);
  var bills = require('../app/controllers/bills');
  bills.routes(app);
  var admin = require('../app/controllers/admin');
  admin.routes(app);
  var stock = require('../app/controllers/stock');
  stock.routes(app);
  var transaction = require('../app/controllers/transactions');
  transaction.routes(app);

  app.get('/', function(req, res){
      res.render('index',{
        title: 'Dashboard'
      });
    }
  );
  app.get('/home/index', function (req, res) {
      res.render('home/index', {
        title: 'Dashboard'
      });
    }
  );
  app.get('/partials/:name', function (req, res) {
      var name = req.params.name;
      res.render('partials/' + name);
    }
  );
  app.get('/templates/:name', function (req, res) {
      var name = req.params.name;
      res.render('templates/' + name, {
        headers: req.headers
      });
    }
  );
  
  // home route
  app.get('/:parent/:child', function (req, res) {
    var parent = req.params.parent,
        child = req.params.child;
    res.render(parent + '/' + child);
      //res.render('/');
  });

}
