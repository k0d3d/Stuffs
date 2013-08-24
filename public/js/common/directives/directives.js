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
        }
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
