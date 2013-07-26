/* Services */


app.factory('itemsService', function($http){
  var i = {};

  i.items =  function(callback){
      $http.get('/api/items/listAll').success(callback);
    };

  i.summary = function(id,callback){
      $http.get('/api/items/listOne/'+id+'/quick').success(callback);
    };
  i.save =  function(post, callback){
      $http.post('/api/items', {item: post}).success(function(status, response){
        callback(response);
      });
    }
  return i;
});
app.factory('ordersService',function($http){
    var f = {};
    f.getItemName = function(query, callback){
        $.getJSON('/items/typeahead/itemName/'+query, function(s) {
            var results = [];
            $.each(s,function(){
              results.push(this.itemName);
            });
            return callback(results);
        });
    };
    f.itemSummary = function(item){
        $.getJSON('items/listOne/'+item+'/quick',function(y){
            return y;
        });
    };
    f.orders = function(){
      var res = [];
      $http.get('/api/orders').success(function(data){
        var r = data;
        angular.copy(r,res);
      });
      return res;
    };
    return f;
});
