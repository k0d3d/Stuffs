
/*!
 * Module dependencies.
 */

var async = require('async')

/**
 * Controllers
 */

var orders = require('../app/controllers/orders'),
    items = require('../app/controllers/items');

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
  var orders = require('../app/controllers/items');
  orders.routes(app);

  app.get('/', function(req, res){
      res.render('index',{
        title: 'Dashboard'
      });
    }
  );
  app.get('/home/index', function(req, res){
      res.render('home/index',{
        title: 'Dashboard'
      });
    }
  );

  app.get('/dashboard/order', function(req, res){
      res.render('index',{
        title: 'Place new order'
      });
    }
  );
  app.get('/orders', function(req, res){
      res.render('index',{
        title: 'All orders'
      });
    }
  );
  app.get('/partials/:name', function (req, res) {
      var name = req.params.name;
      res.render('partials/' + name);
    }
  );

  //Order routes
  //app.get('/api/orders',orders.getOrders);
  //app.post('/api/orders',orders.createOrder);
  
  // home route
  app.get('/:parent/:child', function(req, res){
    var parent = req.params.parent;
    var child = req.params.child;
      res.render(parent+'/'+child);
      //res.render('/');
    }
  );

}
