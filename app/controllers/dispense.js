"use strict";

var mongoose = require("mongoose"),
    Dispense = mongoose.model('Dispense'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    Biller = require("./bills").bills,
    Bill = mongoose.model('Bill'),
    _ = require("underscore"),
    rest = require("restler"),
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
DispenseController.prototype.getDispenseRecord = function(req, res){
  var status = req.params.status;
  var fields = (status === 'pending')?'patientName doctorName issueDate':'';
  var q  = Dispense.find({status: status}, fields);
  q.populate('locationId');
  q.populate('drugs.itemId');
  q.sort({issueDate: -1});
  q.exec(function(err, i){
    res.json(200, i);
  });
};

/**
 * [stockbylocation private function that populates the ]
 * @param  {[type]}   i  [description]
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
function stockbylocation(i, cb){
  var location = {
    id: i.locationId._id
  };

  function c_s (){
    var l = i.drugs.length,
        ds = i.drugs.pop(),
        fx = [];

    StockCount.getStockAmountbyId(ds.itemId._id, location, function(n){
      var h = {
        itemId: ds.itemId,
        currentStock: n.amount,
        amount: ds.amount,
        cost: ds.cost,
        dosage: ds.dosage,
        period: ds.period
      };
      fx.push(h);
      if(--l){
        c_s();
      }else{
        cb(fx);
      }
    });
  }
  c_s();  
}

DispenseController.prototype.getPrescription = function(id, cb){
  var q = Dispense.findOne({_id: id});
  q.populate('locationId');
  q.populate('drugs.itemId', 'itemName sciName itemForm');
  q.exec(function(err, i){
    if(err){
      cb(err);
    }else{
      stockbylocation(i, function(w){
        i.drugs = w;
        cb(i);
      });
    }
  });  
}

/**
 * [dispenseThis description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
DispenseController.prototype.dispenseThis = function(o, callback){
  var dispense = (_.isUndefined(o.id))? new Dispense() : {_id: o.id, drugs: []};
  o.dispenseID = dispense._id;
  var sh = new StockHistory();
  var sc = new StockCount();

  //Get the location to dispense from
  var location = {
    id : o.location._id,
    name: o.location.locationName
  };
  
  //Saves a dispense record
  function saveDispenseRecord(){
    //Create a new record
    if(_.isUndefined(o.id)){
      dispense.patientName = o.patientName;
      dispense.patientId =  o.patientId;
      dispense.class = o.class;
      dispense.doctorId = o.doctorId;
      dispense.doctorName = o.doctorName;
      dispense.locationId = location.id;
      dispense.status = "complete";
      dispense.save(function(err, i){
        if(err){
          return callback(err);
        }else{
          
        }
      });      
    }else if(!_.isUndefined(o.id)){
      Dispense.findOne({_id: o.id}, 'timerId')
      .exec(function(err, timer){
        if(err) return callback(err);
        //Update the record to complete
        Dispense.update({_id: o.id}, {
          status: 'complete',
          dispenseDate: Date.now(),
          drugs: dispense.drugs
        },function(err, i){
          //Process a new bill record
          rest.get('http://192.168.1.102/integra/deactivate.php?remove=0&id='+timer.timerId)
          .on('success', function(d, r){
            console.log(r.statusCode);
          });
          saveBillRecord();
        });
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
DispenseController.prototype.prescribeThis = function(o, cb){
  var prescribe = new Dispense();
  var drugslist = [];

  //Get the location to dispense from
  var location = o.location;
  
  //Saves a dispense record
  function savePrescribeRecord(){
    //Create a new record
      prescribe.patientName = o.patientName;
      prescribe.patientId =  o.patientId;
      prescribe.company = o.company;
      prescribe.doctorId = o.doctorId;
      prescribe.doctorName = o.doctorName;
      prescribe.locationId = location.id;
      prescribe.class = o.class;
      
      //Make Query to Timer API
      rest.get('http://192.168.1.102/integra/activate.php?receive=0&patientid='+o.patientId+'&pharmacyid=4&docid='+o.doctorId)
      .on('success', function(data){
        prescribe.timerId = data;
        prescribe.save(function(err, i){
          if(err){
            return cb(err);
          }else{
            cb(true);
          }
        });
      });
  }

  var total = o.drugs.length, result= [];

  function saveAll (){
    var record = o.drugs.pop();

    // Push the drugs into dispense.drugs instance array
    prescribe.drugs.push({
      itemId: record._id,
      amount: record.amount,
      cost: record.itemPurchaseRate,
      dosage: record.dosage,
      period: record.period
    });      
    if(--total){
      saveAll();
    }else{
      savePrescribeRecord();
    }
  }
  saveAll();
};

module.exports.dispense = DispenseController;
var dispense = new DispenseController();

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
  app.get('/api/items/locations/records/status/:status', dispense.getDispenseRecord);

  app.get('/api/items/prescribe/:prescribeId', function(req, res, next){
    dispense.getPrescription(req.params.prescribeId, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  //Creates a new record for a prescription
  app.post('/api/items/prescribe', function(req, res, next){
    var o = {
      location: {
        id: req.body.location.locationId,
        name: req.body.location.locationName,
        authority: req.body.location.locationAuthority
      },
      patientName : req.body.patientName,
      patientId:  req.body.patientId,
      doctorId: req.body.doctorId,
      doctorName: req.body.doctorName,
      drugs: req.body.drugs,
      class: req.body.class
    }; 
    dispense.prescribeThis(o, function(r){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      return res.json(200, true);
    });
  });

  //Creates a new record for a prescription
  app.post('/api/items/dispense', function(req, res, next){
    var o = req.body;
    dispense.dispenseThis(o, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, true);
      }
    });
  });

  //Updates a presciption record to show its been dispensed
  app.put('/api/items/dispense', function(req, res, next){
    dispense.dispenseThis(o, function(r){

    });
  });
};