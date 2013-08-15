/* Directives */
  /**
  * directives Modules
  *
  * Description
  */
  angular.module('directives', []);
  angular.module('directives').directive('datepicker', function(){
    var linker = function(scope, element, attrs){
      element.datepicker();
    };
    return {
      restrict :'A',
      link: linker
    };
  });
  angular.module('directives').directive('typeahead',function(ordersService, itemsService){
    var linker = function(scope, element, attrs){
      element.typeahead({
        source: function(query, process){
          return ordersService.getItemName(query,function(results){
            return process(results);
          });
        },
        updater: function(item){
          itemsService.summary(item, function(r){
            scope.form.itemData.itemName = r.itemName;
            scope.form.itemData.itemID = r.itemID;
            scope.summary = r;
            scope.ordersummary = 'open-summary';
          });
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
