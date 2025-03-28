// sendNotification.js
const admin = require("./firebaseAdmin");

const sendNotification = async (receiverFcmToken, sender_name, message) => {
  const payload = {
    data: {
      title: `New Message from ${sender_name}`,
      body: message,
      // Optionally add an icon or click_action
      // icon: "path/to/icon.png",
      // click_action: "FLUTTER_NOTIFICATION_CLICK"  // if using Flutter, for example
    },
    token: receiverFcmToken,
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = sendNotification;
