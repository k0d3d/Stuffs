
var mongoose = require("mongoose"),
    Dispense = mongoose.model('Dispense'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    Biller = require("./bills").bills,
    Bill = mongoose.model('Bill'),
    _ = require("underscore"),
    rest = require("restler"),
    EventRegister = require('../../lib/event_register').register,
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
      //If this results in 0
      //do cb() :: the callback
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
  var eventRegister = new EventRegister();

  eventRegister.once('getRecord', function(data, isDone){
    var q = Dispense.findOne({_id: data});
    q.populate('locationId');
    q.populate('drugs.itemId', 'itemName sciName itemForm');
    q.lean();
    q.exec(function(err, i){
      if(err){
        isDone( new Error(err));
      }else{
        isDone(i);
      }
    });      
  });

  eventRegister.once('stockbylocation', function(data, isDone){
    stockbylocation(data, function(w){
      data.drugs = w;
      isDone(data);
    });    
  });

  eventRegister
  .queue('getRecord', 'stockbylocation')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(data){
    cb(data);
  })
  .start(id);

};

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
  
  var eventRegister = new EventRegister();

  //Get the location to dispense from
  var location = {
    id : o.location._id,
    name: o.location.locationName
  };


  //Create a stock record for each dispensed drug item
  function __createRecord(itemObj, cb){
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


  eventRegister.once('saveDispenseRecord', function(data, isDone){
    
    //Create a new record dispense record.
    //by now we've completed 'createrecords'
    dispense.patientName = data.patientName;
    dispense.patientId =  data.patientId;
    dispense.class = data.class;
    dispense.doctorId = data.doctorId;
    dispense.doctorName = data.doctorName;
    dispense.locationId = location.id;
    dispense.status = "complete";
    dispense.save(function(err, i){
      if(err){
        return isDone(new Error(err));
      }else{
        //Pass the orignal request document
        //to the next event. The saveBill
        isDone(data);
      }
    });      
  });


  eventRegister.once('savePrescriptionRecord', function(data, isDone){
    //Lets get the timer Id so we can send a deactivate
    //timer request.
    //data {object} contains the original request.body document
    //sent from the client.
    Dispense.findOne({_id: data.id}, 'timerId')
    .exec(function(err, timer){
      //If there's an error, send it to
      //the error handler.
      if(err) return isDone(new Error(err));
      //Update the record to complete
      Dispense.update({_id: data.id}, {
        status: 'complete',
        dispenseDate: Date.now(),
        drugs: dispense.drugs
      },function(err, i){
        //Process a new bill record
        rest.get('http://192.168.1.102/integra/deactivate.php?remove=0&id='+timer.timerId)
        .on('success', function(d, r){
          //Log the result to the console
          util.puts('Timer deactivated for '+ data.patientName);
        });
        //When done pass in the original document
        //to the next event. saveBill
        isDone(data);
      });
    });
  });

  eventRegister.once('saveBill', function(data, isDone){
    Biller.serveBill(o, function(r){
      isDone(r);
    });
  });

  eventRegister.once('createRecords', function(data, isDone){
    /**
     * creates a stock down record for every drug 
     * item on the list.
     * Updates the stock count to show what has been reduced.
     * Recursive function
     * @return {[type]} [description]
     */
    function saveAll (){
      //var total = data.drugs.length;
      var record = data.drugs.pop();
      
      //console.log(total);

      // Call the create_record function
      __createRecord({id: record._id, amount: record.amount}, function(p){
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
        if(data.drugs.length > 0){
          saveAll();
        }else{
          //call the next event
          isDone(data);
        }
      });
    }

    //Start the save all process
    saveAll();
  });

  //Depending on whether the operation is a new or update;
  //a prescription from a doctor or a fresh one.
  var isNew = (_.isUndefined(o.id))? 'saveDispenseRecord' : 'savePrescriptionRecord';

  eventRegister
  .queue('createRecords', isNew, 'saveBill')
  .onError(function(err){
    callback(err);
  })
  .onEnd(function(d){
    callback(d);
  })
  .start(o);

};

/**
 * prescribeThis records a prescription sent from a doctor.
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