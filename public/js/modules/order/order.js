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
  $scope.changeStatus = function(){
    var o = {
      status : $scope.uo.status,
      itemData : $scope.uo.itemData,
      amount : $scope.uo.amount,
      order_id : $scope.uo.order_id,
      invoiceno : $scope.uo.invoiceno
    };
    ordersService.updateOrder(o,function(r){

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
      $scope.form.suppliers = {
        supplierName : r.supplierName,
        supplierID : r.supplierID
      };
    });
  }
  $scope.saveButtonClass = 'btn-primary';
  $scope.submitOrder = function(){
    ordersService.save($scope.form, function(data){
      $scope.form = '';
    });
  };
})
.factory('ordersService',['$http', 'Notification','Language', function($http, Notification, Lang){
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
          Notification.notifier({
            message : Lang.eng.order.place.success,
            type: 'success'
          });
            callback(data);
        }).
        error(function(err){
          Notification.notifier({
            message : Lang.eng.order.place.error,
            type: 'error'
          });          
        });
    };
    f.updateOrder = function(o,callback){
      $http.put('/api/orders/'+escape(o.order_id), {
          "status": o.status,
          "itemData":o.itemData,
          "amount":o.amount,
          "orderInvoiceNumber": o.invoiceno,
          "amountSupplied": o.amountSupplied || undefined
        })
      .success(function(data){
        Notification.notifier({
          message: Lang.eng.order.update.success,
          type: 'success'
        });
        callback(data);
      })
      .error(function(data){
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

    return f;
}]).directive('orderSupplierTypeAhead', ['itemsService', function(itemsService){
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
            scope.form.itemData.itemID = r.itemID;
            scope.form.itemData._id = r._id;
            scope.form.suppliers = {
              supplierID : r.suppliers[0]._id,
              supplierName: r.suppliers[0].supplierName
            };
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
}]);