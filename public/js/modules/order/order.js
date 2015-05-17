/**
* orders Module
*
* Description
*/
angular.module('order', []).

config(['$routeProvider',function($routeProvider){
  $routeProvider.when('/orders', {templateUrl: '/orders/all', controller: 'ordersIndexController'})
  .when('/orders/pending/:type', {templateUrl: '/orders/all', controller: 'ordersIndexController'})
  .when('/dashboard/orders/cart', {templateUrl: '/orders/cart', controller: 'orderCartController'})
  .when('/dashboard/order', {templateUrl: '/orders/add', controller: 'orderAddController'})
  .when('/dashboard/order/by/:by', {templateUrl: '/orders/add', controller: 'orderAddController'})
  .when('/dashboard/order/:itemId', {templateUrl: '/orders/add', controller: 'orderAddController'});
}])
.controller('orderCartController', [
  '$scope',
  '$http',
  'ordersService',
  '$route',
  function($scope, $http, ordersService, $route){
  // $scope.orderCart = ordersService.cart;
  $scope.selectedCart = [];

  $scope.selectedView = false;

  $scope.checkAllClick = function () {
    $scope.selectedCart = angular.copy($scope.orderCart);
  };


  $scope.placeOrder = function (cb) {
    if (!confirm('Confirm you want to place an order for these items!')) {
      cb(false);
      return false;
    }

    if (!$scope.selectedCart.length) {
      alert('Please select items you want');
      return false;
    }

    ordersService.postCart($scope.selectedCart, function (list) {
      $route.reload();

      cb(true);
    });
  };

  $scope.send_sms = function(){
    var allSuppliers = _.map($scope.basket, function(v, i){
      return v.supplier.supplierID;
    });
    var uniqSupId = _.uniq(allSuppliers);
    if(uniqSupId.length > 1){
      return alert('Cannot send SMS to '+ uniqSupId.length +' suppliers at once');
    }else{
      ordersService.notifySupplier(uniqSupId, 'sms', function(d){

      });
    }
  };

}])
.controller('ordersIndexController', [
  '$scope',
  '$http',
  '$location',
  '$routeParams',
  'ordersService',
  // '$q',
  function($scope, $http, $location, $routeParams, ordersService){

  $scope.ordersfilter = {
    orderStatus : ''
  };
  (function(){
    $scope.orders = [];

    ordersService.orders(function(r){
      angular.forEach(r, function(v){
        v.nextStatus = function () {
          return ((v.orderStatus + 1) !== 2) ? v.orderStatus + 1 : 6;
        };
        $scope.orders.push(v);
      });
      switch($routeParams.type){
        case 'invoices':
        $scope.ordersfilter.orderStatus = 2;
        break;
        case 'order':
        console.log('message');
        $scope.ordersfilter.orderStatus = 0;
        break;
        default:
        $scope.ordersfilter.orderStatus = '';
        break;
      }
    });


  }());

  $scope.removeOrder = function(event, order_id){
    var currentItem = event.currentTarget;
    console.log(currentItem);
    ordersService.remove(order_id, function(o){
      if(o.state === 1){
        $(currentItem).parents('tr').remove();
      }
    });
  };
  // $scope.changeStatus = function(){
  //   var o = {
  //     status : $scope.uo.status,
  //     itemData : $scope.uo.itemData,
  //     amount : $scope.uo.amount,
  //     order_id : $scope.uo.order_id,
  //     invoiceno : $scope.uo.invoiceno
  //   };
  //   ordersService.updateOrder(o,function(r){

  //   });
  // };
}])
.controller('orderAddController',[
  '$scope',
  '$http',
  '$location',
  'ordersService',
  'itemsService',
  '$routeParams',
  '$q',
  function($scope, $http, $location, ordersService,itemsService, $routeParams, Q){
  $scope.form = {
    itemData: {},
    supplierData: {}
  };
  $scope.modal = {};
  if($routeParams.itemId){
    itemsService.summary($routeParams.itemId, 'main', function(r){
      $scope.summary = r;
      $scope.form.itemData.itemName = r.itemName;
      $scope.form.itemData.id = r._id;
      $scope.form.nafdacRegNo = r.nafdacRegNo;
      $scope.form.nafdacRegName = r.itemName;
      $scope.form.orderPrice = r.itemPurchaseRate;
      $scope.form.suppliers = {
        supplierName : r.supplierName,
        supplierID : r.supplierID
      };
    });
  }

  console.log($location.search());

  if($location.by === 'composition'){
    $scope.plcordr = true;
  }else{
    $scope.searchndl = true;
  }

  $scope.toggle = function(){
    $scope.plcordr = !$scope.plcordr;
    $scope.searchndl = !$scope.searchndl;
  };

  $scope.searchcmp = function(searchQuery, query){
    $scope.searching_icon = true;
    Q.all([
      ordersService.request_search(searchQuery, 'inventory', query),
      ordersService.request_search(searchQuery, 'drugstoc', query),
      ordersService.request_search(searchQuery, 'nafdac', query)
    ])
    .then(function (resolvedPromise) {
      $scope.searching_icon = false;
      $scope.inventoryResults = resolvedPromise[0].data.results;
      $scope.drugstocResults = resolvedPromise[1].data.results;
      $scope.nafdacResults = resolvedPromise[2].data.results;

      $scope.inventoryCount = resolvedPromise[0].data.totalCount;
      $scope.drugstocCount = resolvedPromise[1].data.totalCount;
      $scope.nafdacCount = resolvedPromise[2].data.totalCount;
      if (!$scope.activePane) {
        $scope.activePane = 'iv';
      }
    });
    // ordersService.searchCmp(searchQuery)
    // .
  };

  $scope.currentPage = {
    'inventory' : 0,
    'drugstoc': 0,
    'nafdac': 0
  };

  $scope.skipSearch = function skipSearch(searchQuery, page, scope) {
    ordersService.request_search(searchQuery, scope, {page: page})
    .then(function (result) {
      if (scope === 'inventory') {
        $scope.inventoryResults = result.data.results;
      }
      if (scope === 'drugstoc') {
        $scope.drugstocResults = result.data.results;
      }
      if (scope === 'nafdac') {
        $scope.nafdacResults = result.data.results;
      }
      $scope.currentPage[scope] = page;
    });
  };


  $scope.more = function (index) {
    ordersService.moreInfo($scope.cmps[index]._id, function(r){
      $scope.ds = r;
      $scope.ds.index = index;
    });
  };

  // $scope.orderthis = function(){
  //   if($scope.ds.length === 0) return false;
  //   $scope.form = {
  //     orderType: 'Medication',
  //     itemData : {
  //       itemName: $scope.ds.productName,
  //       sciName: $scope.ds.composition
  //     },
  //     suppliers:{
  //       supplierName: $scope.ds.man_imp_supp
  //     },
  //     nafdacRegNo: $scope.ds.regNo,
  //     nafdacRegName: $scope.ds.productNameja
  //   };
  //   $scope.toggle();
  // };

  $scope.orderItem = function orderItem (item, scope) {

      var toOrder = {
        itemName: item.itemName || item.title,
        sciName: item.sciName || item.description,
        orderAmount: item.orderAmount,
        orderPrice: item.itemPurchaseRate || item.price,
        orderDate: Date.now(),
        product_id: item.product_id,
        sku: item.sku
      };
      if (scope === 'iv') {
        toOrder.itemId = item._id;
      }
      ordersService.save(toOrder)
      .then(function () {
        ordersService.cartUpdated(toOrder);
      });

  };

  $scope.saveButtonClass = 'btn-primary';
  // $scope.submitOrder = function(){
  //   ordersService.save($scope.form, function(data){
  //     $scope.form = '';
  //   });
  // };
}])
.factory('ordersService',[
  '$http',
  'Notification',
  'Language',
  '$rootScope',
  function($http, Notification, Lang, $rootScope){
    var f = {};

    f.cart = [];

    f.cartUpdated = function (item) {
      this.cart.push(item);
      $rootScope.$broadcast('cart-updated');
    };

    f.cartLoaded = function (cart) {
      this.cart = cart;
      $rootScope.$broadcast('cart-updated');
    };

    f.searchCmp = function(srchstr, catrcmp, page, callback){
      $http.get('/api/orders/ndl/'+srchstr+'/'+catrcmp+'/'+page)
      .success(function(d, r){
        if(_.isEmpty(d)){
          Notification.notifier({
            message: Lang.eng.order.search.notfound,
            type: 'error'
          });
        }
        callback(d);
      })
      .error(function(d, r){
        Notification.notifier({
          message: Lang.eng.order.search.error,
          type: 'error'
        });
      });
    };

    f.request_search = function request_search (query, scope, options) {
      return $http.get('/api/items/search?s=' + query + '&scope=' + scope + '&' + $.param(options));
    };

    f.getAllSuppliers = function(callback){
      $http.get('/api/orders/suppliers/').success(function(data){
        callback(data);
      });
    };
    f.getSupplierName = function(query, callback){
      // $http.get('/api/orders/supplier/typeahead/'+query).success(function(data){
      //   callback(data);
      // });
      $.getJSON('/api/orders/supplier/typeahead/'+ query, function(s) {
          var results = [];
          $.each(s,function(){
            results.push(this.supplierName);
          });
          callback(results);
      });
    };
    f.orders = function(callback){
      var res = [];
      $http.get('/api/orders').success(function(data){
        var r = data;
        angular.copy(r,res);
        return callback(res);
      });
    };
    f.getCartContent = function getCartContent (){
      return $http.get('/api/cart');
    };
    f.postCart = function(form, callback){
      $http.post('/api/orders/cart', form).
        success(function(data) {
          Notification.notifier({
            message : Lang.eng.order.place.success,
            type: 'success'
          });
            callback(data);
        }).
        error(function(){
          Notification.notifier({
            message : Lang.eng.order.place.error,
            type: 'error'
          });
        });
    };
    f.save = function(form){
      return $http.post('/api/orders', form)
        .then(function() {
          Notification.notifier({
            message : Lang.eng.order.place.success,
            type: 'success'
          });
        }, function(){
          Notification.notifier({
            message : Lang.eng.order.place.error,
            type: 'error'
          });
        });
    };
    f.updateOrder = function(o, callback){
      $http.put('/api/orders/' + o.order_id, {
          'orderStatus': o.orderStatus,
          'orderInvoiceNumber': o.orderInvoiceNumber,
          'amountSupplied': o.amountSupplied || 0,
          'paymentReferenceType': o.paymentReferenceType,
          'paymentReferenceID': o.paymentReferenceID
        })
      .success(function(data){
        Notification.notifier({
          message: Lang.eng.order.update.success,
          type: 'success'
        });
        callback(data);
      })
      .error(function(){
        Notification.notifier({
          message: Lang.eng.order.update.error,
          type: 'error'
        });
      });

    };
    f.count = function(callback){
      $http.get('api/orders/count').
        success(function(d){
          callback(d);
        });
    };
    f.remove = function(order_id, callback){
      $http.delete('/api/orders/'+order_id)
      .success(callback);
    };
    f.moreInfo = function (id, callback) {
      $http.get('/api/orders/ndl/' + id + '/summary')
      .success(function (d) {
        callback(d);
      })
      .error(function (d) {
        Notification.notifier({
          message: Lang[Lang.set].order.summary.error,
          type: 'error'
        });
      });
    };

    f.notifySupplier = function(id, type, cb){
      $http.post('/api/suppliers/'+id+'/notify?type='+type)
      .success(function(d){
        cb(d);
      })
      .error(function(err){
        //Fit in error here
      });
    };

    return f;
}])
.directive('orderSupplierTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getSupplierName(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(name){
          _.some(nx, function(v,i){
            if(v.supplierName === name){
              scope.form.suppliers = {
                supplierID : v._id,
                supplierName: v.supplierName
              };
              return true;
            }
          });
          scope.$apply();
          return name;
        }
      });
  };
  return {
    link: linker
  };
}])
.directive('orderItemTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getItemName(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(name){
          itemsService.summary(name,'main', function(r){
            scope.form.itemData.itemName = r.itemName;
            scope.form.itemData.id = r._id;
            scope.form.suppliers = {
              supplierID : r.suppliers[0]._id,
              supplierName: r.suppliers[0].supplierName
            };
            scope.form.nafdacRegNo = r.nafdacRegNo;
            scope.form.nafdacRegName = r.itemName;
            scope.form.orderPrice = r.itemPurchaseRate;
            scope.summary = r;
          });
          scope.$apply();
          return name;
        }
      });
  };
  return {
    link: linker
  };
}])
.filter('orderState', function () {
  return function (num) {
    var returnVal;
    switch (parseInt(num)) {
      case -1:
      returnVal =  'cancelled';
      break;
      case 0:
      returnVal =  'cart';
      break;
      case 1:
      returnVal =  'pending order';
      break;
      case 2:
      returnVal =  'received';
      break;
      case 3:
      returnVal =  'supplied';
      break;
      case 4:
      returnVal =  'paid';
      break;
      case 5:
      returnVal =  'complete';
      break;
      default:
      returnVal =  'processing';
      break;
    }

    return returnVal;
  };
})
.directive('orderList', ['ordersService','Notification','Language', function(OS, N, L){
  function link (scope, element, attrs) {


  }
  function Ctrlr ($scope){

    $scope.updateOrder = function(index){
      if (($scope.orderList[index].nextStatus()) === 2) return false;
      if($scope.orderList[index].nextStatus === 2 &&
        (!$scope.orderList[index].amountSupplied ||
          !$scope.orderList[index].orderInvoice)){
        alert('Please check the required fields: Missing Amount / Invoice Number');
        return false;
      }
      if($scope.orderList[index].nextStatus === 3 &&
        (!$scope.orderList[index].paymentReferenceType ||
          !$scope.orderList[index].paymentReferenceID)){
        alert('Please check the required fields: Payment ID / Payment Type');
        return false;
      }
      var o ={
        orderStatus : $scope.orderList[index].nextStatus,
        order_id : $scope.orderList[index]._id,
        orderInvoiceNumber : $scope.orderList[index].orderInvoice,
        amountSupplied: $scope.orderList[index].amountSupplied,
        paymentReferenceType: $scope.orderList[index].paymentReferenceType,
        paymentReferenceID: $scope.orderList[index].paymentReferenceID
      };
      OS.updateOrder(o, function(r){
        $scope.orderList[index].orderStatus = r.result;
        // $scope.orderList[index].nextStatus = $scope.getStatus({status: r.result});
        if(r.result === 2 && ($scope.orderList[index].amountSupplied < $scope.orderList[index].orderAmount)){
          N.notifier({
            message: L[L.set].order.update.amountDis,
            type: 'info'
          });
        }
      });
    };


    $scope.removeOrder = function(event, order_id){
      var currentItem = event.currentTarget;
      OS.remove(order_id, function(o){
        if(o.state === 1){
          $(currentItem).parents('tr').remove();
        }
      });
    };

  }
  return {
    link: link,
    controller: Ctrlr,
    scope: {
      orderList: '=',
      ordersFilter: '=',
      getStatus: '&'
    },
    templateUrl: '/templates/order-list'
  };
}]);