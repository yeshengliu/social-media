const newMsgSound = (senderName) => {
  const sound = new Audio("/light.mp3");

  sound && sound.play();

  if (senderName) {
    document.title = `New message from ${senderName}`;

    // Change title back to Messages only when the message window is active
    if (document.visibilityState === "visible") {
      setTimeout(() => {
        document.title = "Messages";
      }, 5000);
    }
  }
};

export default newMsgSound;
