var mongoose = require("mongoose"),
    Dispense = mongoose.model('Dispense'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    Biller = require("./bills").bills,
    Bill = mongoose.model('Bill'),
    _ = require("underscore"),
    util = require("util");

/**
 * Dispense Class
 */

function DispenseController (){

}

DispenseController.prototype.constructor = DispenseController;



/**
 * [getDispenseRecord description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
DispenseController.getDispenseRecord = function(req, res){
  var status = req.params.status;
  var q  = Dispense.find({status: status});
  q.populate('locationId');
  q.sort({issueDate: -1});
  q.exec(function(err, i){
    res.json(200, i);
  });
};

/**
 * [dispenseThis description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
DispenseController.dispenseThis = function(o, callback){
  var dispense = new Dispense();
  o.dispenseID = dispense._id;
  var sh = new StockHistory();
  var sc = new StockCount();

  //Get the location to dispense from
  var location = {
    id : o.location.id,
    name: o.location.name
  };
  
  //Saves a dispense record
  function saveDispenseRecord(){
    //Create a new record
    if(_.isUndefined(o._id)){
      dispense.patientName = o.patientName;
      dispense.patientId =  o.patientId;
      dispense.company = o.company;
      dispense.doctorId = o.doctorId;
      dispense.doctorName = o.doctorName;
      dispense.locationId = location.id;
      dispense.status = "complete";
      dispense.save(function(err, i){
        if(err){
          return callback(err);
        }else{
          saveBillRecord();
        }
      });      
    }else if(!_.isUndefined(o._id)){
      Dispense.update({_id: o._id}, {

      },function(err, i){

      });
    }

  }

  //lastly:: Saves a bill record
  function saveBillRecord(){
    Biller.serveBill(o, function(r){
      callback(r);
    });
  }

  //Create a stock record for each dispensed drug item
  function create_record(itemObj, cb){
    var others = {
          action: 'Dispense',
          reference: 'dispense-'+o.dispenseID
        };

    sh.log(itemObj, location, others, function(r){
      if(util.isError(r)){
        callback(r);
      }else{
        cb(r);
      }
    });
  }

  var total = o.drugs.length, result= [];

  function saveAll (){
    var record = o.drugs.pop();

    // Call the create_record function
    create_record({id: record._id, amount: record.amount}, function(p){
      // Create or update this locations stock count
      StockCount.update({
        item: p.item,
        $or:[{
            locationName : location.name
          },{
            locationId: location.id
          }]
        },{
          $inc: {
            amount: -p.amount
          }
        }, function(err, i){
          if(err){
            if(err) return callback(err);
          }
        }, true);
      // Push the drugs into dispense.drugs instance array
      dispense.drugs.push({
        itemId: record._id,
        itemName: record.itemName,
        amount: record.amount,
        status: record.status,
        cost: record.cost,
        dosage: record.dosage,
        period: record.period
      });
      if(--total){
        saveAll();
      }else{
        saveDispenseRecord();
      }
    });
  }
  saveAll();
};

/**
 * [prescribeThis records a prescription sent from a doctor. ]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
DispenseController.prescribeThis = function(o, callback){     
  var dispense = new Dispense();
  var bill = new Bill();
  var drugslist = [];

  //Get the location to dispense from
  var location = {
    id : req.body.location._id,
    name: req.body.location.locationName
  };
  
  //Saves a dispense record
  function saveDispenseRecord(){
    //Create a new record
    if(req.method === 'POST'){
      dispense.patientName = req.body.patientName;
      dispense.patientId =  req.body.patientId;
      dispense.company = req.body.company;
      dispense.doctorId = req.body.doctorId;
      dispense.doctorName = req.body.doctorName;
      dispense.locationId = location.id;
      dispense.save(function(err, i){
        if(err){
          return next(err);
        }else{
          saveBillRecord();
        }
      });      
    }

  }

  //Saves a bill record
  function saveBillRecord(){
    bill.dispenseID = dispense._id;
    bill.patientName = req.body.patientName;
    bill.patientId =  req.body.patientId;    
    bill.save(function(err, i){
      if(err) res.json('500',{"message": err});
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");      
      res.json(200, {});
    })
  }

  //Create a stock record for each dispensed drug item
  function create_record(itemObj, cb){
    var stockhistory = new StockHistory();
    stockhistory.item = itemObj.id;
    stockhistory.locationId = location.id;
    stockhistory.locationName = location.name;
    stockhistory.amount = itemObj.amount;
    stockhistory.action = 'Dispense';
    stockhistory.reference = 'dispense-'+dispense._id;
    stockhistory.save(function(err, i){
      cb(i);
    });

  }

  var total = req.body.drugs.length, result= [];

  function saveAll (){
    var request = req.body.drugs;
    var record = request.pop();

    // Call the create_record function
    create_record({id: record._id, amount: record.amount}, function(p){
      // Create or update this locations stock count
      StockCount.update({
        item: p.item,
        $or:[{
            locationName : location.name
          },{
            locationId: location.id
          }]
        },{
          $inc: {
            amount: -p.amount
          }
        }, function(err, i){
          if(err){
            if(err) res.json(400, {"message": err});
          }
        }, true);
      // Push the drugs into dispense.drugs instance array
      dispense.drugs.push({
        item: record._id,
        amount: record.amount,
        status: record.status,
        cost: record.itemPurchaseRate,
        dosage: record.dosage,
        period: record.period
      });      
      if(--total){
        saveAll();
      }else{
        saveDispenseRecord();
      }
    });
  }
  saveAll();
};

module.exports.dispense = DispenseController();
module.exports.routes = function(app){
  app.get('/dispensary',function(req, res){
    res.render('index',{
      title: 'Dispense Drugs'
    });
  });
  app.get('/dispensary/:dispense_id',function(req, res){
    res.render('index',{
      title: 'Dispense Drugs'
    });
  });

  //Gets a prescription record by locationId
  app.get('/api/items/locations/records/status/:status', DispenseController.getDispenseRecord);

  //Creates a new record for a prescription
  app.post('/api/items/prescribe', function(req, res, next){
    DispenseController.prescribeThis(o, function(r){

    });
  });

  //Creates a new record for a prescription
  app.post('/api/items/dispense', function(req, res, next){
    var o = {
      location: {
        id: req.body.location._id,
        name: req.body.location.locationName
      },
      patientName : req.body.patientName,
      patientId:  req.body.patientId,
      company: req.body.company,
      doctorId: req.body.doctorId,
      doctorName: req.body.doctorName,
      drugs: req.body.drugs,
      class: req.body.class
    };
    DispenseController.dispenseThis(o, function(r){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, true);
      }
    });
  });

  //Updates a presciption record to show its been dispensed
  app.put('/api/items/dispense', function(req, res, next){
    DispenseController.dispenseThis(o, function(r){

    });
  });
};