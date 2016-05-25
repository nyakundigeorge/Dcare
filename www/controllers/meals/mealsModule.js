var glucoseModule = angular.module('dCare.meals', ['ionic',
                                                     'dCare.Services.PatientsStore', 'dCare.Services.MealsStore',
                                                     'dCare.dateTimeBoxDirectives', 'highcharts-ng']);

//Controllers
glucoseModule.controller('MealsListController', function ($scope, $ionicSideMenuDelegate, $state, $stateParams, mealsList, currentPatient, MealsStore) {

    $scope.parentState = ($stateParams.parentState) ? $stateParams.parentState : 'dashboard';

    // Init Menu
    $scope.menuItems = [
                        { id: 1, title: 'Dashboard', subTitle: 'Your summary page', icon: 'ion-home' },
                        { id: 2, title: 'Add New', subTitle: 'Add a new meal entry', icon: 'ion-person-add' },
                        { id: 3, title: 'See Trend', subTitle: 'Calories consumption graph', icon: 'ion-android-chat' },
                        { id: 4, title: 'Alerts / Recomendations', subTitle: 'Your Messages & Alerts', icon: 'ion-android-chat' },
                        { id: 5, title: 'Settings', subTitle: 'Change Application preferences', icon: 'ion-gear-b' }
                       ];

    // init enums [to add more enums use $.extend($scope.enums, newEnum)]
    $scope.enums = MealsStore.enums;

    // Init Data
    $scope.mealsList = mealsList;
    $scope.currentPatient = currentPatient;

    // Action Methods

    $scope.showHelp = function () {
        $scope.showOverlayHelp = true;
    };

    $scope.editMeal = function (mealsID) {
        $state.go("mealForm", { patientID: $scope.currentPatient.id, mealsID: mealsID, parentState: 'mealslist' });
    };

    $scope.newMeal = function () {
        $state.go("mealForm", { patientID: $scope.currentPatient.id, parentState: 'mealslist' });
    };

    $scope.activateMenuItem = function (menuItemId) {
        switch (menuItemId) {
            case 1:
                $state.go("dashboard", { patientID: $stateParams.patientID });
                break;
            case 2:
                $scope.newMeal();
                break;
            case 3:
                $state.go("mealtrend", { patientID: $scope.currentPatient.id, parentState: 'mealslist' });
                break;
            case 4:
                alert('Messages/Notificaions');
                break;
            case 5:
                alert('Settings');
                break;
            default:
                alert('No Match');
        }
    };

    $scope.toggleActionsMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    //Action Methods
    $scope.navigateBack = function () {
        // transition to previous state
        app.log.info("State reached : "  + $scope.parentState);
        $state.go($scope.parentState, { patientID: $scope.currentPatient.id });
    };

    $scope.$on("navigate-back", function (event, data) {
        if (data.intendedController === "MealsListController") $scope.navigateBack();
    });

});



glucoseModule.controller('MealsFormController', function ($scope, $ionicSideMenuDelegate, $mdDialog, $state, $stateParams, meal, currentPatient, MealsStore) {

    // init enums [to add more enums use $.extend($scope.enums, newEnum)]
    $scope.enums = MealsStore.enums;

    // Init Data
    $scope.currentPatient = currentPatient;
    if (meal) {
        $scope.meal = meal;
    } else {
        $scope.meal = { patientID: $scope.currentPatient.id, mealDetails:[], datetime: castToLongDate(new Date()) };  // New entry : make any default values here if any
    }
    $scope.parentState = ($stateParams.parentState) ? $stateParams.parentState : 'mealslist';

    $scope.showFoodItemDialog = function showDialog(foodItem) {
        $mdDialog.show({
            parent: angular.element(document.body),            
            scope: $scope,
            preserveScope: true,
            templateUrl: 'views/meals/food_entry.html',
            locals: {
                foodItem: foodItem
            },
            controller: addFoodItemController
        });
        function addFoodItemController($scope, $mdDialog, foodItem) {
            if (foodItem) {
                $scope.food = foodItem;
            } else {
                $scope.food = {};
            }
            $scope.closeDialog = function () {
                $mdDialog.hide();
            };

            $scope.add = function () {
                if ($scope.food_entry_form.$valid) {
                    $scope.meal.mealDetails.push($scope.food);
                    $mdDialog.hide();
                }
            };

            $scope.addAndNew = function () {
                if ($scope.food_entry_form.$valid) {
                    $scope.meal.mealDetails.push($scope.food);
                    $scope.food = {};
                }
            };
        }
    };

    $scope.deleteFoodItem = function (index) {
        $scope.meal.mealDetails.splice(index,1);
    };

    var createMealSummary = function (mealDetails) {
        var summaryText = "";
        for (var i = 0; i < mealDetails.length; i++) {
            summaryText = summaryText + ((mealDetails[i].quantity) ? (mealDetails[i].quantity + mealDetails[i].quantityUnit) : "") + " " + mealDetails[i].foodItem;
            if (i == (mealDetails.length - 2)) {
                summaryText = summaryText + " & ";
            } else if(i != (mealDetails.length-1)) {
                summaryText = summaryText + " , ";
            }
        }
        return summaryText;
    };

    // Action Methods
    $scope.changeState = function (meal) {
        //$scope.glucose = glucose;
        // transition to next state
        $state.go($scope.parentState, { patientID: $scope.currentPatient.id });
    };

    $scope.save = function () {
        if ($scope.meal_entry_form.$valid) {
            $scope.meal.datetime = castToLongDate($scope.meal.datetime);
            $scope.meal.mealSummary = createMealSummary($scope.meal.mealDetails);
            var saveMealDataPromise = MealsStore.save($scope.meal);
            saveMealDataPromise.then($scope.changeState, $scope.saveFailed);
        }
    };

    $scope.cancel = function () {
        // If required ask for confirmation
        $scope.changeState($scope.meal);
    };

    $scope.saveFailed = function (errorMessage) {
        $mdDialog.show($mdDialog.alert()
                               .title('Something went wrong :(')
                               .content('This is embarassing!!. Operation responded with ' + errorMessage)
                               .ariaLabel(errorMessage)
                               .ok('OK!'));
    };

    //Action Methods
    $scope.navigateBack = function () {
        // transition to previous state
        $scope.cancel();
    };

    $scope.$on("navigate-back", function (event, data) {
        if (data.intendedController === "MealFormController") $scope.navigateBack();
    });
});


//glucoseModule.controller('GlucoseTrendController', function ($scope, $ionicSideMenuDelegate, $state, $stateParams, glucoseTrendData, currentPatient, GlucoseStore) {

//    $scope.parentState = ($stateParams.parentState) ? $stateParams.parentState : 'glucoselist';


//    // init enums [to add more enums use $.extend($scope.enums, newEnum)]
//    $scope.enums = GlucoseStore.enums;
    


//    // Init Data
//    $scope.currentPatient = currentPatient;
//    $scope.data = glucoseTrendData;

//    //  High Charts options

//    $scope.glucoseChartConfig = {
//        chart: {
//                   type: 'lineChart',
//                   spacingTop:0,
//                   spacingBottom:0,
//                   spacingRight:50,
//                   spacingLeft:0,
//                   marginTop:0,
//                   marginBottom:0,
//                   marginRight:50,
//                   marginLeft:0
//               },
//        xAxis: {
//                   type: 'datetime',
//                   dateTimeLabelFormats: { // don't display the dummy year
//                                        month: '%e. %b',
//                                        year: '%b'
//                                     },
//                   title: {
//                          text: 'Date'
//                   }
//               },
//     yAxis: {
//        title: {
//                text: 'Glucose mg/dL'
//            },
//            min: 0,
//            plotBands: [{ // Extreme High
//                from: 180,
//                to: 500,
//                color: 'rgba(255, 137, 137, 0.15)',
//                label: {
//                    text: 'High Blood Glucose',
//                    style: {
//                        color: '#606060'
//                    }
//                }
//            },
//                 { // 
//                from: 150,
//                to: 180,
//                color: 'rgba(255, 197, 70, 0.15)',
//                label: {
//                    text: 'Borderline Diabetic',
//                    style: {
//                        color: '#606060'
//                    }
//                }
//            }, { // Normal
//                from: 90,
//                to: 150,
//                color: 'rgba(70, 255, 30, 0.15)',
//                label: {
//                    text: 'Normal',
//                    style: {
//                        color: '#606060'
//                    }
//                }
//            }, { // Low blood sugar
//                from: 0,
//                to: 90,
//                color: 'rgba(255, 137, 137, 0.15)',
//                label: {
//                    text: 'Low Blood Sugar',
//                    style: {
//                        color: '#606060'
//                    }
//                }
//            }]
//        },
//        tooltip: {
//            headerFormat: '<b>{series.name}</b><br>',
//            pointFormat: '{point.x:%e. %b}: {point.y:.2f} mg/dL'
//        },
//        title: {
//            text: 'Glucose Trend over time'
//        },
//        subtitle: {
//            text: 'Shows how did your glucose values perform'
//        },
//        series: $scope.data
//    };

    
//    // Action Methods
//    $scope.navigateBack = function () {
//        // transition to previous state
//        $state.go($scope.parentState, { patientID: $scope.currentPatient.id });
//    };

//    $scope.$on("navigate-back", function (event, data) {
//        if (data.intendedController === "GlucoseTrendController") $scope.navigateBack();
//    });

//});



// Routings
glucoseModule.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
          .state('mealslist', {
              resolve: {
                  mealsList: function (MealsStore, $stateParams) { return MealsStore.getAllMealsForPatient($stateParams.patientID); },
                  currentPatient: function (PatientsStore, $stateParams) { return PatientsStore.getPatientByID($stateParams.patientID); }
              },
              //url: '/identificationInfo',  // cannot use as using params[]
              templateUrl: 'views/meals/list.html',
              controller: 'MealsListController',
              params: { 'patientID': null, 'parentState': null }
          })
          .state('mealForm', {
              resolve: {
                  meal: function (MealsStore, $stateParams) { return MealsStore.getMealByID($stateParams.mealsID); },
                  currentPatient: function (PatientsStore, $stateParams) { return PatientsStore.getPatientByID($stateParams.patientID); }
              },
              //url: '/identificationInfo',  // cannot use as using params[]
              templateUrl: 'views/meals/new_entry.html',
              controller: 'MealsFormController',
              params: { 'patientID': null, 'mealsID': null, 'parentState': null }
          //})
          //.state('glucosetrend', {
          //    resolve: {
          //        glucoseTrendData: function (GlucoseStore, $stateParams) { return GlucoseStore.getLineGraphDataForPatient($stateParams.patientID); },
          //        currentPatient: function (PatientsStore, $stateParams) { return PatientsStore.getPatientByID($stateParams.patientID); }
          //    },
          //    //url: '/identificationInfo',  // cannot use as using params[]
          //    templateUrl: 'views/glucose/trend.html',
          //    controller: 'GlucoseTrendController',
          //    params: { 'patientID': null, 'parentState': null }
          });

});