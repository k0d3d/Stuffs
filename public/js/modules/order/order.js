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

  $scope.removeOrder = function(event, order_id){
    var currentItem = event.currentTarget;
    console.log(currentItem);
    ordersService.remove(order_id, function(o){
      if(o.state === 1){
        $(currentItem).parents('tr').remove();
      }
    });
  };
  $scope.changeStatus = function(status,itemData,amount,order_id){
    console.log(order_id);
    ordersService.updateOrder(status,itemData,amount,order_id,function(r){

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
    itemsService.summary($routeParams.itemId, 'main', function(r){
      $scope.summary = r;
      $scope.form.itemData.itemName = r.itemName;
      $scope.form.itemData.itemID = r.itemID;
      $scope.form.itemData._id = r._id;
      $scope.form.orderSupplierName = r.supplierName;
      $scope.form.orderSupplierID = r.supplierID;
    });
  }
  $scope.$watch('selectedItem', function(newValue, oldValue){
    if(newValue !== oldValue){
      if(newValue['itemname']){
        itemsService.summary(newValue['itemname'],'main', function(r){
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
      $scope.modal.heading= 'Order Placed';
      $scope.modal.body= "You've succesfull placed an order. To place another order, \n close this dialog or return to the dashboard";
      $scope.form = '';
      $scope.modal.class= 'md-success';
      $scope.modal.modalState= 'md-show';
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
    f.updateOrder = function(status,itemData,amount,order_id,callback){
      $http.put('/api/orders/'+escape(order_id), {"status": status,"itemData":itemData,"amount":amount});
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

    return f;
});