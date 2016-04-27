angular.module('dCare.Services.NotificationsStore', ['dCare.Services.NotificationService'])

/**
* A Patient Store service that returns notification data.
*/
.factory('NotificationsStore', function ($q, $filter, NotificationService) {  //NR: $filter is used for MOCK, remove it if not required later
    // Will call phonegap api for storing/retriving patient data and returns a JSON array
    var notificationsDataStore = new DataStore({
        dataStoreName: 'Notifications',
        dataAdapter: 'pouchDB',
        adapterConfig: { auto_compaction: true }
    });  // Initialize Reminders  DataStore

    //var NotificationService = $injector.get('NotificationService');

    var enums = {
        notificationType: {
            1: { label: 'Medicine', short_label: 'Medicine', image: 'img/no-image.png', value: 1 },
            2: { label: 'Insulin', short_label: 'Insulin', image: 'img/no-image.png', value: 2 },
            3: { label: 'Dr. Appointment', short_label: 'Dr. Appointment', image: 'img/no-image.png', value: 3 },
            4: { label: 'Glucose test', short_label: 'Glucose test', image: 'img/no-image.png', value: 4 },
            5: { label: 'BP check', short_label: 'BP check', image: 'img/no-image.png', value: 5 },
            6: { label: 'Recommendation', short_label: 'Recommendation', image: 'img/no-image.png', value: 6 },
            7: { label: 'Other', short_label: 'Other', image: 'img/no-image.png', value: 7 }
        },
        frequencyUnit: {
            1: { label: 'Year', short_label: 'Yearly', image: '', value: 1 },
            2: { label: 'Month', short_label: 'Monthly', image: '', value: 2 },
            3: { label: 'Week', short_label: 'Weekly', image: '', value: 3 },
            4: { label: 'Hour', short_label: 'Hourly', image: '', value: 4 },
            5: { label: 'Minutes', short_label: 'Minutes', image: '', value: 5 }
        }
    };
    // Some fake testing data
    //var notificationList = [
    //                { id: 0, patientID: '1', text: 'Notification 1', title: 'Notification 1', notificationType: 1, startdate: '1288323623006', duedate: '1288523623006', enddate: '1288323623006', frequencyUnit: 1, frequency: 1, status: 'active' data: "some Data" reminderID:3},
    //                { id: 1, patientID: '1', text: 'Notification 2', title: 'Notification 2', notificationType: 3, startdate: '1289323623006', duedate: '1288523623006', enddate: '1288323623006', frequencyUnit: null, frequency: null, status: 'expired' data: "some Data" reminderID:3},
    //                { id: 2, patientID: '2', text: 'Notification 3', title: 'Notification 3', notificationType: 2, startdate: '1298323623006', duedate: '1288523623006', enddate: '1288323623006', frequencyUnit: null, frequency: null, status: 'expired' data: "some Data" reminderID:3},
    //                { id: 3, patientID: '4', text: 'Notification 4', title: 'Notification 4', notificationType: 1, startdate: '1288523623006', duedate: '1288523623006', enddate: '1288323623006', frequencyUnit: 1, frequency: 1, status: 'active' data: "some Data" reminderID:3}
	//                ];

    var scheduleNativeNotification = function (notification) {
        var deferredScheduleNotification = $q.defer();
        //if (NotificationService.isNotificationServiceAvailable()) {
            var nativeNotificationCofig = {
                id: notification.id,
                text: notification.text,
                title: notification.title,
                //every: (notification.frequencyUnit) ? notification.frequencyUnit : null, // not needed as recurring handled explicitly
                date: notification.startdate,
                data: notification
            };
        NotificationService.scheduleNotification(nativeNotificationCofig).then(function () {
                deferredScheduleNotification.resolve(notification);
            }).catch(function (err) {                   // NR: Catch corresponds to relative $q promise of angular. Hence Required.
                deferredScheduleNotification.reject(err);
            });
        //} else {
        //    deferredScheduleNotification.reject("Notification Service Unavailable!!");
        //}
        return deferredScheduleNotification.promise;
    };

    var computeNextRecurringNotification = function (notification) {
        var nextOccuringNotification = null, occuranceFrequency ;
        if (notification && notification.frequencyUnit) {            
            occuranceFrequency = (notification.frequency > 0) ? notification.frequency : 1; // Default frequency to 1 in case empty
            nextOccuringNotification = {};
            nextOccuringNotification.patientID = notification.patientID;
            nextOccuringNotification.text = notification.text;
            nextOccuringNotification.title = notification.title;
            nextOccuringNotification.notificationType = notification.notificationType;
            nextOccuringNotification.frequencyUnit = notification.frequencyUnit;
            nextOccuringNotification.frequency = notification.frequency;
            nextOccuringNotification.status = "active";
            nextOccuringNotification.reminderID = notification.reminderID;
            nextOccuringNotification.enddate = notification.enddate;

            switch (nextOccuringNotification.frequencyUnit) {
                case 1: //Yearly
                    nextOccuringNotification.startdate = castToLongDate(new Date(notification.startdate).addYears(occuranceFrequency));
                    break;
                case 2: //Monthly
                    nextOccuringNotification.startdate = castToLongDate(new Date(notification.startdate).addMonths(occuranceFrequency));
                    break;
                case 3: //Weekly
                    nextOccuringNotification.startdate = castToLongDate(new Date(notification.startdate).addWeeks(occuranceFrequency));
                    break;
                case 4: //Hourly
                    nextOccuringNotification.startdate = castToLongDate(new Date(notification.startdate).addHours(occuranceFrequency));
                    break;
                case 5: //Minute
                    nextOccuringNotification.startdate = castToLongDate(new Date(notification.startdate).addMinutes(occuranceFrequency));
                    break;
            }

            nextOccuringNotification.data = "";

            if(nextOccuringNotification.startdate > notification.enddate) {  // Expiry/End Date reached, so no new notification to schedule
                nextOccuringNotification = null;
            }
        }
        return nextOccuringNotification;
    };

    return {
        enums: enums,
        computeNextRecurringNotification: computeNextRecurringNotification,
        getCount: function (patientID) {
            return notificationsDataStore.search({
                select: 'count(id)',
                where: "patientID = " + patientID
            });
        },
        getAllNotificationsForPatient: function (patientID) {
            return notificationsDataStore.search({
                select: '*',
                where: "patientID=" + patientID + ""
            });
        },
        getActiveNotificationsForPatient: function (patientID) {
            return notificationsDataStore.search({
                select: '*',
                where: "patientID=" + patientID + " and status= 'active'" + " and (enddate >=" + castToLongDate(new Date()) + " or enddate='')"
            });
        },
        getNotificationForReminder: function (reminderID) {
            return notificationsDataStore.search({
                select: '*',
                where: "status= 'active' and reminderID=" + reminderID + ""
            });
        },
        getNotificationByID: function (notificationID) {
            return notificationsDataStore.getDataByID(notificationID);
        },
        remove: function (notificationID) {
            // Just delete the notification & its native counter-part
            var deferredDelete = $q.defer();
            var me = this; 
            this.getNotificationByID(notificationID).then(function (notificationToBeDeleted) {
                if (notificationToBeDeleted && notificationToBeDeleted.id > 0) {
                        notificationsDataStore.remove(notificationToBeDeleted.id).then(function () {     // Delete current notification from data store
                            if (NotificationService.isNotificationServiceAvailable()) {                     // Delete native counter-part
                                NotificationService.removeNotification(notificationToBeDeleted.id);
                            }
                            deferredDelete.resolve();
                        }).fail(function (err) {
                            app.log.error("Could not delete notification." + " [Error: " + err + "]");
                            deferredDelete.reject(err);
                        });
                } else {
                    app.log.error("Could not find notification with ID: " + notificationID);
                    deferredDelete.resolve();
                }
            }).fail(function (err) {
                deferredDelete.reject(err);
            });
            return deferredDelete.promise;
        },
        snoozeNotification: function (notificationID) {
            // check if notification is recursive, if no recursive delete datastore entry + remove native notification via service
            // if recursive, reschedule next notification in the series, and delete the current notfication as above
            var deferredSnooze = $q.defer();
            var me = this, nextOccurance; // computeNextRecurringNotification();
            this.getNotificationByID(notificationID).then(function (notificationToBeDeleted) {
                if (notificationToBeDeleted && notificationToBeDeleted.id > 0) {
                    nextOccurance = computeNextRecurringNotification(notificationToBeDeleted);
                    if (nextOccurance) {                                                                  // Recursive
                        me.notificationsDataStore.remove(notificationToBeDeleted.id).then(function () {   // Delete current notification
                            if (NotificationService.isNotificationServiceAvailable()) {                   // Delete native counter-part
                                NotificationService.removeNotification(notificationToBeDeleted.id);
                            }
                            me.notificationsDataStore.save(nextOccurance).then(function () {              // Attempt re-schedule recursive notification
                                deferredSnooze.resolve();
                            }).fail(function (err) {              // re-scheduling notification fails
                                app.log.error("Could not set next recurring notification." + " [Error: " + err + "]");
                                deferredSnooze.resolve();
                            });
                        }).fail(function (err) {                  // delete failed 
                            app.log.error("Could not snooze notification." + " [Error: " + err + "]");
                            deferredSnooze.reject(err);
                        });
                    } else {                                                                                // Non-Recursive, one-Time
                        me.notificationsDataStore.remove(notificationToBeDeleted.id).then(function () {     // Delete current notification
                            if (NotificationService.isNotificationServiceAvailable()) {                     // Delete native counter-part
                                NotificationService.removeNotification(notificationToBeDeleted.id);
                            }
                            deferredSnooze.resolve();
                        }).fail(function (err) {
                            app.log.error("Could not snooze notification." + " [Error: " + err + "]");
                            deferredSnooze.reject(err);
                        });                       
                    }
                } else {
                    app.log.error("Could not find notification with ID: " + notificationID);
                    deferredSnooze.resolve();
                }
            }).fail(function (err) {
                deferredSnooze.reject(err);
            });
            return deferredSnooze.promise;
        },
        save: function (notification) {
            var deferredSave = $q.defer();
            if (notification.status && notification.status === "expired") {
                notificationsDataStore.save(notification).then(function (notificationSavedData) {
                    if (notificationSavedData.id > 0) {
                        if (NotificationService.isNotificationServiceAvailable()) {                     // Delete native counter-part
                            NotificationService.removeNotification(notificationSavedData.id);
                        }
                    }
                    deferredSave.resolve(notificationSavedData);
                }).fail(function (err) {
                    deferredSave.reject(err);
                });
            } else {
                notification.status = "active";
                notificationsDataStore.save(notification).then(function (notificationSavedData) {
                        scheduleNativeNotification(notificationSavedData).then(function () {                // Add a native counter-part
                        deferredSave.resolve(notificationSavedData);
                    }).catch(function (err) {                        
                        deferredSave.resolve(notificationSavedData);
                    });
                }).fail(function (err) {
                    deferredSave.reject(err);
                });
            }           

            return deferredSave.promise;
        }
    }
});