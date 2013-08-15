
/*!
 * Module dependencies.
 */

var async = require('async')

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
  app.get('/partials/:name', function (req, res) {
      var name = req.params.name;
      res.render('partials/' + name);
    }
  );
  
  // home route
  app.get('/:parent/:child', function(req, res){
    var parent = req.params.parent;
    var child = req.params.child;
      res.render(parent+'/'+child);
      //res.render('/');
    }
  );

}
