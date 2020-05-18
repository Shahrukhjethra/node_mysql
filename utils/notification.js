var FCM = require("fcm-push");
var fcm = new FCM(process.env.FCMKEY);

module.exports = async (object) => {
    var message = {
        registration_ids: object.deviceToken,
        data: {
            Notificationtype: object.notificationType
        },
        notification: {
            title: object.title,
            body: object.body,
            sound: 'default'
        },
    };

    try {
        //const fcmObject = await fcm.send(message);
        //console.log("fcmObject", fcmObject);        
    } catch (error) {
        console.log("error", error);
    }
}