var dsItems = require('./dsitem/dsitem'),
    logger = require('./dsitem/logger'),
    config = require('config'),
    Q = require('q'),
    moment = require('moment'),
    OrderController = require('./order').order,
    request = require('request'),
    _ = require('lodash'),
    util = require('util');

function DSController () {
  // this.requestLib = request;
  this.DS_CLOUD_URL = config.api.DS_CLOUD_URL;
  this.DS_CLOUD_ROUTES = config.api.DS_CLOUD_ROUTES;
  this.lastUpdateLog = {};
  this.requestOptions = {
    headers: {
      'Authorization': 'Basic ZHJ1Z3N0b2M6ZHJ1Z3N0b2M='
    },
    baseUrl: this.DS_CLOUD_URL,
    qs : {
    consumer_key : 'ck_74d23e186250997246f0c198148441d4',
    consumer_secret :'cs_f80adcc85109c0611a2a5aedce731df7',
    'filter[limit]' : config.api.DS_CLOUD_PAGE_LIMIT
    }
  };

  this.getLastUpdateTime = function () {
      var q = Q.defer();

      logger.find()
      .limit(1)
      .sort('-lastUpdateTime')
      .exec(function (err, i) {
        if (err) {
          return q.reject(err);
        }
        return q.resolve(i);
      });
      return q.promise;
  };
}

DSController.prototype.constructor = DSController;

DSController.prototype.checkUpdates = function(req, cb){
  // var r = [];
  // var dt = new Date();
  // var ld = req.session.lastUpdate || dt.toJSON();
  // //var ld = '2013-10-29T16:42:17.158Z';
  // var spoken = [];
  // var DSC = this;


  // function speakPrice (){
  //   _.each(r[1], function(v){
  //     spoken.push(
  //       v.product_id.productName + ' by ' + v.product_id.man_imp_supp + ' updates price to ' + v.price
  //     );
  //   });
  // }

  // function speakOrders () {
  //   _.each(r[0], function(v){
  //     spoken.push(
  //       'Order for ' + v.order_id.orderAmount + ' ' +  v.order_id.nafdacRegName + ' from ' + v.order_id.orderSupplier[0].supplierName + ' is ' + v.status
  //     );
  //   });
  // }

  // function orderCheck(){
  //   rest.get(DSC.DS_CLOUD_URL + '/api/orders/hospital/1008/updates/' + ld)
  //   .on('success', function(data){
  //     if(!_.isEmpty(data)){
  //       var orders = new OrderController();
  //       orders.isDispatched(data);
  //     }
  //     r.push(data);
  //     drugCheck(ld);
  //   })
  //   .on('error', function(err){
  //     cb(err);
  //   })
  //   .on('fail', function(err){
  //     cb(err);
  //   });
  // }
  // function drugCheck(){
  //   rest.get(DSC.DS_CLOUD_URL + '/api/drugs/updates/'+ld)
  //   .on('success', function(data){
  //     if(!_.isEmpty(data)){
  //       var ndl = new NDL();
  //       ndl.priceUpdated(data);
  //       var items = new Items();
  //       items.updateByReg(data);
  //     }
  //     r.push(data);

  //     speakPrice();
  //     speakOrders();

  //       //Final Callback :: remember to set last update
  //       req.session.lastUpdate = dt.toJSON();
  //       cb(spoken);
  //   })
  //   .on('error', function(err){
  //     cb(err);
  //   })
  //   .on('fail', function(err){
  //     cb(err);
  //   });
  // }



  // orderCheck();

  // DSC.getLastUpdateTime()
  // .then(function (logObj) {
  //   //if now is after 7 days from out last update..
  //   //ie. if we havent updated in 7 days
  //   var urlString;
  //   if (moment().isAfter(moment(logObj.lastUpdateTime).add(7, 'days'))) {
  //     urlString = '';
  //   } else {
  //     urlString= '';
  //   }
  // });
};

DSController.prototype.refreshProductInformation = function refreshProductInformation () {
  var q = Q.defer(), self = this;

  function mapImgSrc (img) {
    return img.src;
  }

  function mapProductAttribs (attrs) {
    return {
      'name': attrs.name,
      'options': attrs.options
    };
  }

  function saveRecords (products, count, num) {

    num = num || 0;

    var s = {
      title: products[num].title,
      sku: products[num].sku,
      price: products[num].price,
      regular_price: products[num].regular_price,
      description: products[num].description,
      categories: products[num].categories,
      tags: products[num].tags,
      imagesSrc: _.map(products[num].images, mapImgSrc),
      attributes: _.map(products[num].attributes, mapProductAttribs),
      created_at: products[num].created_at,
      updated_at: products[num].updated_at,
      permalink: products[num].permalink
    };
    // title : {type: String, default: '', required: true},
    // sku : {type: String, required: true},
    // price : {type: Number, required: true},
    //  : {typupdatee: Number, required: true},
    // description : {type: String, required: true},
    // categories : [{type: String, required: true}],
    // tags : [{type: String, required: true}],
    // imagesSrc: [{type: String, required: true}],
    // attributes: [{
    //   'name': {type: String},
    //   'options': [{type: String}]
    // }],
    // currentPrice:{type: Number},
    // created_at: {type: Date},
    // updated_at: {type: Date}

    dsItems.update({
      sku: products[num].sku
    },s ,{
      upsert: true
    }, function (err, didUpdate) {
      if (err) {
        console.log(err);
        return q.reject(err);
      }
      if (didUpdate && (num < count - 1)) {
        return saveRecords(products, count, num + 1);
      }
        console.log(num, count, num < count);
    });



  }

  function runUpdates (page) {
    page = page || 0;

    request(_.extend(self.requestOptions, {
      url : self.DS_CLOUD_ROUTES.ALL_WC_PRODUCTS,
      method: 'GET',
      qs : _.extend(self.requestOptions.qs, {page: page})
      }),
      function (e, r, body) {
        if (e) {
          return q.reject(e);
        }
        var payload = JSON.parse(body);

        if (!payload) return q.reject(new Error(util.format('Update Failed: %s', payload)));

        if (!payload.products && payload.errors) return q.reject(payload.errors[0].message);

        if (payload.products.length) {
          console.log(payload.products.length);
          console.log(page);
          saveRecords(payload.products, payload.products.length);
          runUpdates(page + 1);
          return q.resolve(payload.length);
        } else {
          //do nothing
          return q.resolve(true);
        }
      });
  }

  runUpdates();

  return q.promise;
};

module.exports = new DSController();