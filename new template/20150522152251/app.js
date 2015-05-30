var page = angular.module('summernote-page', ['ngRoute']);

page.controller('PageController', function ($scope, $location, $anchorScroll) {
  var $body = $(document.body);
  var $navbar = $('.navbar');

  $scope.$on('$routeChangeSuccess', function () {
    var $sidebar = $('.bs-page-sidebar');

    $body.scrollspy({
      target: '.bs-page-sidebar',
      offset: $navbar.height()
    });

    $sidebar.affix({
      offset: {
        top: function() {
          var offsetTop = $sidebar.offset().top;
          var nPadding = 20;
          return (this.top = offsetTop - nPadding - $navbar.height());
        }, bottom: function() {
          return (this.bottom = $('.bs-page-footer').outerHeight(true));
        }
      } 
    });

    $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
  });

  $scope.scrollTo = function(id) {
    $location.hash(id);
    $anchorScroll();
  };
});

page.config(['$routeProvider', '$locationProvider',
            function ($routeProvider, $locationProvider) {

  $routeProvider.when('/', {
    templateUrl: 'html/main.html'
  }).when('/getting-started', {
    templateUrl: 'html/getting-started.html',
    controller: 'PageController'
  }).when('/deep-dive', {
    templateUrl: 'html/deep-dive.html',
    controller: 'PageController'
  }).when('/example', {
    templateUrl: 'html/example.html',
    controller: 'PageController'
  }).when('/history', {
    templateUrl: 'html/history.html',
    controller: 'PageController'
  }).when('/team', {
    templateUrl: 'html/team.html'
  }).otherwise({redirectTo: '/'});
}]);
