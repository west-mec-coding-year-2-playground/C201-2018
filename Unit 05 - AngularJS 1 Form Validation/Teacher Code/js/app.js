var myApp = angular.module('myApp', []);

myApp.controller('RegistrationController', ['$scope', function($scope) {
    $scope.register = function() {
        $scope.message = 'Thank you for your submission, ' + $scope.user.firstname;
    };
}]);
