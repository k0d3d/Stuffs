
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
  app.get('/items/index', function(req, res){
      res.render('items/index',{
        title: 'Dashboard'
      });
    }
  );
  app.get('/items/list', function(req, res){
      res.render('index',{
        title: 'All Items'
      });
    }
  );  
  app.get('/partials/:name', function (req, res) {
      var name = req.params.name;
      res.render('partials/' + name);
    }
  ); 

  //Order routes
  app.get('/orders/new',orders.new) 
  app.get('/orders/list',orders.list) 
  app.post('/orders/create',orders.create)

  //Item routes   
  app.get('/items/add',items.add) 
  app.get('/items/listAll',items.list) 
  app.get('/items/listOne/:id/:summary',items.listOne) 
  app.get('/items/typeahead/:term/:needle',items.typeahead)
  app.post('/items/create',items.create)
  
  // home route
  app.get('/:parent/:child', function(req, res){
      res.render('index');
      //res.render('/');
    }
  );

}
