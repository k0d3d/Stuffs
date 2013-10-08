/* Directives */
  /**
  * directives Modules
  *
  * Description
  */
  angular.module('directives', []);
  angular.module('directives').directive('typeAhead',function(ordersService, itemsService){
    var ser;
    var linker = function(scope, element, attrs){
        ser = {
          suppliername : ordersService.getSupplierName,
          itemname : itemsService.getItemName
        };
        scope.selectedItem ={
          suppliername: '',
          itemname: ''
        };
        element.typeahead({
          source: function(query, process){
            return ser[attrs.thName](query,function(results){
              return process(results);
            });
          },
          updater: function(item){
            scope.selectedItem[attrs.thName] = item;
            scope.$apply();
            return item;
          }
        });
    };
    return{
      restrict: 'A',
      link: linker
    };
  });
  angular.module('directives').directive('onFinish',function($timeout){
    return {
      restrict: 'A',
      link: function(scope, element, attr){
        if(scope.$last === true){
          $timeout(function(){
            switch (attr.onFinish){
              case "panorama":
                $('.panorama').panorama({
                   //nicescroll: false,
                   showscrollbuttons: false,
                   keyboard: true,
                   parallax: false
                });
              break;
              case "tableheader":
                $('table.table').fixedHeader();
              break;
              case "checkViewState":
                scope.$emit('onFinishLoaded', true);
              break;
              default:
              break;
            }
          });
          
        }
      }
    };
  });
  angular.module('directives').directive('modalbox', [function(){
    return {
      link: function($scope, iElm, iAttrs, controller) {
        $(iElm).on('click',function(){
          $('#mopop').modal('show');
        });
      }
    };
  }]);
  /**
  * directives Module
  *
  * Description
  */
  angular.module('directives').directive('toggleActiveList', [function(){
    // Runs during compile
    return {
      link: function($scope, iElm, iAttrs, controller) {
        iElm.on('click','li',function(e){
          e.preventDefault();
          $('ul.list-block li').removeClass('active');
          $(e.currentTarget).addClass('active');
        });
      }
    };
  }]);
  angular.module('directives').directive('orderActionButton', function(ordersService){
    function getStatus (status){
        var d;
        switch(status){
          case 'pending order':
            d = 'supplied';
            //scope.orders[attrs.thisIndex].next ="Supplied";
          break;
          case 'supplied':
            d = 'paid';
            //scope.orders[attrs.thisIndex].next ="Paid";
          break;
          case 'paid':
           d = 'Complete';
          break;
          default:
          break;
        }
        return d;
    }

    return {
      link: function(scope, element, attrs, controller){
        var invoiceNo, index;
        //Observe index
        attrs.$observe('index', function(newValue){
          index = newValue;
          scope.orders[index].next = getStatus(scope.orders[index].orderStatus);
          //bindEmAll(index, scope, element);
          //console.log(scope.orders[index]);
        });

        //Bind to 
        element.on('click', function(e){
          e.preventDefault();
          var status = getStatus(scope.orders[index].orderStatus);
          var itemData = scope.orders[index].itemData[0];
          var amount = scope.orders[index].orderAmount;
          var order_id = scope.orders[index]._id;
          var invoiceNo = scope.orders[index].orderInvoice;
          //scope.$apply();
          console.log(index);
          ordersService.updateOrder(status,itemData,amount,order_id,invoiceNo, function(r){
            scope.orders[index].orderStatus = r.result;
            scope.orders[index].next = getStatus(r.result);
            console.log(r);
          });
        });
      }
    };
  });
