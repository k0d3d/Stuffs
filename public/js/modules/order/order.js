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
  $scope.changeStatus = function(status,itemData,amount,orderId){
    console.log(itemData);
    ordersService.updateOrder(status,itemData,amount,orderId,function(r){

    });
  };
})
.controller('orderAddController',function($scope, $http, $location, ordersService,itemsService, $routeParams){
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
  $scope.$watch('selectedItem', function(newValue, oldValue){
    if(newValue !== oldValue){
      if(newValue['itemname']){
        itemsService.summary(newValue['itemname'], function(r){
          $scope.form.itemData.itemName = r.itemName;
          $scope.form.itemData.itemID = r.itemID;
          $scope.form.itemData._id = r._id;
          $scope.summary = r;
        });
      }
    }
  }, true);
  $scope.saveButtonClass = 'btn-primary';
  $scope.submitOrder = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    ordersService.save($scope.form, function(data){
      $scope.$parent.modal.heading= 'Order Placed';
      $scope.$parent.modal.body= "You've succesfull placed an order. To place another order, \n close this dialog or return to the dashboard";
      $scope.form = '';
      $('.md-modal').addClass('md-show md-success');
      $('.md-overlay').addClass('success-overlay');
      $scope.saveButtonText = 'Save';
    });
  };
})
.factory('ordersService',function($http){
    var f = {};
    f.getAllSuppliers = function(callback){
      $http.get('/api/orders/suppliers/'+escape(query)).success(function(data){
        callback(data);
      });
    };
    f.getSupplierName = function(query, callback){
      // $http.get('/api/orders/supplier/typeahead/'+query).success(function(data){
      //   callback(data);
      // });
      $.getJSON('/api/orders/supplier/typeahead/'+escape(query), function(s) {
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
    f.save = function(form, callback){
      $http.post('/api/orders', form).
        success(function(data) {
            callback(data);
        }).
        error(function(err){
          console.log(err);
        });
    };
    f.updateOrder = function(status,itemData,amount,orderId,callback){
      $http.put('/api/orders/'+escape(orderId), {"status": status,"itemData":itemData,"amount":amount});
    };
    f.count = function(callback){
      $http.get('api/orders/count').
        success(function(d){
          callback(d);
        });
    };
    return f;
});