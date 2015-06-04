angular.module('vitalsStore.services', [])

/**
* A Patient Store service that returns patient data.
*/
.factory('VitalsStore', function ($q, $log, $filter) {  //NR: $filter is used for MOCK, remove it if not required later
    // Will call data store api for storing/retriving patient data and returns a JSON 
    vitalsDataStore = new DataStore({
        dataStoreName: 'Vitals',
        dataAdapter: 'pouchDB',
        adapterConfig: { auto_compaction: true }
    });  // Initialize Patients DataStore
    // Some fake testing data
    //var vitalsList = [
	//                { id: 0, patientID: '1', height: '250', heightunit: "Cm", weight: "50", weightunit: "Kg", bmi: "125", bpsystolic: "125", bpdiastolic: "145", datetime: '1288323623006' },
	//                { id: 1, patientID: '1', height: '150', heightunit: "Cm", weight: "70", weightunit: "Kg", bmi: "175", bpsystolic: "155", bpdiastolic: "129", datetime: '1091246400000' },
	//                { id: 2, patientID: '2', height: '250', heightunit: "Cm", weight: "50", weightunit: "Kg", bmi: "125", bpsystolic: "125", bpdiastolic: "145", datetime: '1288323623006' },
	//                { id: 3, patientID: '4', height: '250', heightunit: "Cm", weight: "50", weightunit: "Kg", bmi: "125", bpsystolic: "125", bpdiastolic: "145", datetime: '1091246400000' }
	//                ];

    var prepareLineGraphData = function (data, xFieldName, yFieldName, label) {
        var lineGraphData = [];
        
        if (angular.isArray(xFieldName) && angular.isArray(yFieldName) && angular.isArray(label)) {
            if ((xFieldName.length == yFieldName.length) && (xFieldName.length == label.length)) {
                for (var i = 0; i < xFieldName.length; i++) {
                    lineGraphData[i] = {
                        name: label[i],
                        data: prepareLineGraphSeriesData(data,xFieldName[i],yFieldName[i])
                    }
                }
            } else {
                $log.error("VitalsStore.prepareLineGraphData : Function parameters invalid, all array[] should have same size");
            }
            
        } else if (angular.isString(xFieldName) && angular.isString(yFieldName)) {
            lineGraphData.push({
                name: (label) ? label : "Graph",
                data: prepareLineGraphSeriesData(data, xFieldName, yFieldName)
            });
        } else {
            $log.error("VitalsStore.prepareLineGraphData : Function parameters mismatch, either all should be array[] or all should be string");
        }
        return lineGraphData;
    };
    var prepareLineGraphSeriesData = function (data, xFieldName, yFieldName) {
        var dataSeries=[];
                
        if (data && xFieldName && yFieldName) {
            for(var i=0 ; i<data.length ; i++){
                var row = data[i];
                dataSeries.push([(((row[xFieldName]) ? row[xFieldName] : "")), (((row[yFieldName]) ? row[yFieldName] : ""))]);
            }
        } else {
            dataSeries.push([]);
        }
        return (dataSeries);
    };


    return {
        getCount: function (patientID) {
            return vitalsDataStore.search({
                select: 'count(id)',
                where: "patientID = " + patientID
            });
        },
        getAllVitalsForPatient: function (patientID) {
            return vitalsDataStore.search({
                select: '*',
                where: "patientID=" + patientID + ""
            });
        },
        getVitalByID: function (vitalsID) {
            return vitalsDataStore.getDataByID(vitalsID);
        },
        getGraphDataForHeight: function (patientID) {
            var deferredFetch = $q.defer();
            this.getAllVitalsForPatient(patientID).then(function (data) {
                deferredFetch.resolve(prepareLineGraphData(data, "datetime", "height", "Height"));
            });
            return deferredFetch.promise;
        },
        getGraphDataForWeight: function (patientID) {
            var deferredFetch = $q.defer();
            this.getAllVitalsForPatient(patientID).then(function (data) {
                deferredFetch.resolve(prepareLineGraphData(data, "datetime", "weight", "Weight"));
            });
            return deferredFetch.promise;
        },
        getGraphDataForBP: function (patientID) {
            // Search on patients
            var deferredFetch = $q.defer();

            this.getAllVitalsForPatient(patientID).then(function (data) {
                deferredFetch.resolve(prepareLineGraphData(data, ["datetime", "datetime"], ["bpsystolic", "bpdiastolic"], ["BP - Systolic", "BP - Diastolic"]));
            });
            return deferredFetch.promise;
        },
        getGraphDataForBMI: function (patientID) {
            var deferredFetch = $q.defer();
            this.getAllVitalsForPatient(patientID).then(function (data) {
                deferredFetch.resolve(prepareLineGraphData(data, "datetime", "bmi", "BMI"));
            });
            return deferredFetch.promise;
        },
        getLatestVitalsForPatient: function (patientID) {
            var deferredFetch = $q.defer();
            vitalsDataStore.find({
                fields: ['datetime', 'patientID'],
                selector: { datetime: { '$exists': true }, patientID: {"$eq" : parseInt(patientID)} },
                sort: [{ 'datetime': 'desc' }],
                limit: 1
            }).then(function (data) {
                deferredFetch.resolve(data[0]);
            });
            return deferredFetch.promise;
        },
        save: function (vitals) {
            return vitalsDataStore.save(vitals);
        }

    }
});