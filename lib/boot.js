var
  Admin = require('../app/controllers/admin').admin,
  nconf = require('nconf');


function _setMainLocation(){
  var admin = new Admin();
  // This method will check for a main location
  // or create one if it doesnt exist already.
  // its callback will attach the location ObjectId
  // to our config instance.
  admin.createMainLocation(function (r) {
    nconf.set('app:main_stock_id', r._id.toString());
    console.log('Set Main Location Id: ' + nconf.get('app:main_stock_id'));
  });
}

function _getFacilityInformation () {
  if (nconf.get('app:facility').length === 0) {

    return nconf.set('app:facility', {
      name: 'New Ikeja Hospital',
      address: 'Gbajobi Ikeja',
      phone_number: '08126488955'
    });
    // admin.thisFacility(function (t) {
    // });
  }
}

module.exports = function(){
  //Run Set location function
  _setMainLocation();
  _getFacilityInformation();
};