/**
* orders Module
*
* Description
*/
angular.module('order', []).

config(['$routeProvider',function($routeProvider){
  $routeProvider.when('/orders', {templateUrl: '/orders/all', controller: 'ordersIndexController'})
  .when('/dashboard/order', {templateUrl: '/orders/add', controller: 'orderAddController'})
  .when('/dashboard/order/:itemId', {templateUrl: '/orders/add', controller: 'orderAddController'});
}]).
controller('ordersIndexController', function($scope, $http, $location, $dialog, ordersService){
  (function(){
    ordersService.orders(function(r){
      $scope.orders = r;    
    });
  }());
  $scope.changeStatus = function(status,itemId,amount,orderId){
    console.log('click');
    ordersService.updateOrder(status,itemId,amount,orderId,function(r){

    });
  }    
})
.controller('orderAddController',function($scope, $http, $location, $dialog, ordersService,itemsService, $routeParams){
  $scope.form = {
    itemData: {},
    supplierData: {}
  };
  $scope.modal = {};
  if($routeParams.itemId){
    itemsService.summary($routeParams.itemId, function(r){
      $scope.summary = r;
      $scope.form.itemData.itemName = r.itemName;
      $scope.form.itemData.itemID = r.itemID;
      $scope.form.orderSupplier.orderSupplierName = r.supplierName;
      $scope.form.orderSupplier.orderSupplierID = r.supplierID;
    });
  }
  $scope.submitOrder = function(){
    ordersService.save($scope.form, function(data){
      console.log('what d fuck');
      $scope.modal = {
        heading : 'Save New Order',
        body: 'Order has been placed.',
      };
    });
  };
})
.factory('ordersService',function($http){
    var f = {};
    f.getItemName = function(query, callback){
        $.getJSON('/api/items/typeahead/itemName/'+query, function(s) {
            var results = [];
            $.each(s,function(){
              results.push(this.itemName);
            });
            return callback(results);
        });
    };
    f.itemSummary = function(item){
        $.getJSON('/apiitems/listOne/'+item+'/quick',function(y){
            return y;
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
    f.save = function(form, callback){
      $http.post('/api/orders', form).
        success(function(data) {
            callback(data);
        }).
        error(function(err){
          console.log(err);
        });
    };
    f.updateOrder = function(status,itemId,amount,orderId,callback){
      $http.put('/api/orders/'+orderId, {"status": status,"itemId":itemId,"amount":amount});
    };
    f.count = function(callback){
      $http.get('api/orders/count').
        success(function(d){
          callback(d);
        });
    };
    return f;
});