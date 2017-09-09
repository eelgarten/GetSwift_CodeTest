/**
 * Created by Elias Elgarten on 9/7/2017.
 */
var myApp = angular.module('myApp', []);
myApp.controller('DroneDataCtrl', ['$scope', '$http', function ($scope, $http) {
    var depotLatitude = -37.816664;
    var depotLongitude = 144.963848;
    var droneSpeed = "50"; // in km/hr

    var drones = [];
    var packages = [];

    // hit the local API to get the drone data
    var getDrones = function () {
        return $http.get('/getDrones').then(function (response) {
            drones = JSON.parse(response.data);
            getPackages();
        });
    }

    // hit the local API to get the package data
    var getPackages = function () {
        return $http.get('getPackages').then(function (response) {
            packages = JSON.parse(response.data);
            createAssignments();
        });
    }

    var createAssignments = function () {
        // order the packages by the soonest deadline
        packages.sort(sortByProperty('deadline'));
        var assignments = [];
        var unassignedPackageIds = [];

        // iterate over the packages to assign each one
        packages.forEach(function (pkg) {
            if (drones.length == 0) {
                unassignedPackageIds.push(pkg['packageId']);
                console.log("drones have all been assigned");
                return;
            }

            var quickestDrone = drones[0];

            // iterate over the drones to figure out which can deliver this package the fastest
            drones.forEach(function (drone) {
                if (calculateDeliveryTime(drone, pkg) < calculateDeliveryTime(quickestDrone, pkg)) {
                    quickestDrone = drone;
                }
            });

            // if the lowest delivery time can't get the package to the destination by the deadline, then
            // it can't be assigned, so add it to the unassigned package IDs
            if (calculateDeliveryTime(quickestDrone, pkg) + Date.now() / 1000 > pkg.deadline) {
                // put this package in the unassigned package IDs because it can't be delivered by the deadline
                // and continue to the next package
                unassignedPackageIds.push(pkg['packageId']);
                return;
            }
            else {
                // assign the package to the drone with the lowest delivery time
                var newAssignment = {};
                newAssignment.droneId = quickestDrone.droneId;
                newAssignment.packageId = pkg.packageId;
                assignments.push(newAssignment);

                // remove the drone from the drones list because it can't be assigned to another package after this
                for (var i = drones.length - 1; i >= 0; --i) {
                    if (JSON.stringify(drones[i]) === JSON.stringify(quickestDrone)) {
                        drones.splice(i, 1);
                    }
                }
            }
        });

        $scope.assignmentData = {};
        $scope.assignmentData.assignments = assignments;
        $scope.assignmentData.unassignedPackageIds = unassignedPackageIds;

        // convert the JSON to a string so it can be displayed in raw form on the page
        JSON.stringify($scope.assignmentData);
    };

    // calculate the delivery time in seconds for a given drone and package
    var calculateDeliveryTime = function (drone, pkg) {
        var distanceToDepot;
        var totalDistance = 0;
        var totalTime;

        // if the drone has no package assigned to it already, then calculate the time it takes for the drone to go
        // back to the depot from its current location
        // if the drone does have a package assigned to it already, then calculate the remaining time in that delivery
        // and add it to the time it will take from the delivery destination back to the depot
        if (drone.packages.length == 0) {
            distanceToDepot = calculateCoordinateDistance(drone.location.latitude, depotLatitude, drone.location.longitude, depotLongitude);

            totalDistance += distanceToDepot;
        }
        else if (drone['packages'].length == 1) {
            var currentPackage = drone['packages'][0];
            var distanceRemaining = calculateCoordinateDistance(drone.location.latitude, currentPackage.destination.latitude, drone.location.longitude, currentPackage.destination.longitude);

            totalDistance += distanceRemaining;

            distanceToDepot = calculateCoordinateDistance(currentPackage.destination.latitude, depotLatitude, currentPackage.destination.longitude, depotLongitude);

            totalDistance += distanceToDepot;
        }
        else {
            console.log("drone contained invalid number of packages");
        }

        // add the amount time it will take to deliver this package from the depot to the package destination
        // to the amount of time
        var distanceToDestination = calculateCoordinateDistance(depotLatitude, pkg.destination.latitude, depotLongitude, pkg.destination.longitude);
        totalDistance += distanceToDestination;

        totalTime = (totalDistance / droneSpeed) * 60 * 60;

        return totalTime / 1000;
    };

    // calculate the distance between two sets of coordinates
    // this is the Haversine Formula
    var calculateCoordinateDistance = function(lat1, lon1, lat2, lon2) {
        var R = 6371; // km
        var dLat = (lat2-lat1).toRad();
        var dLon = (lon2-lon1).toRad();
        var lat1 = lat1.toRad();
        var lat2 = lat2.toRad();

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d;
    }

    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }

    var sortByProperty = function (property) {
        return function (x, y) {
            return ((x[property] === y[property]) ? 0 : ((x[property] > y[property]) ? 1 : -1));
        };
    };

    $scope.init = function () {
        getDrones();
    };



}]);

