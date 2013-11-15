/*
Reports Class
 */

/*
Module dependencies
 */




/**
 *Report Routes
 */

module.exports.routes = function(app){
  //Move this route to seperate file
  app.get('/reports', function(req, res){
      res.render('index');
  });


  app.get('/reports/bills', function(req, res){
      res.render('index');
  });

  //Lookup all bills
  //app.get('/api/bills', item.getBills);	
};