export const executeSuccessAction = (successAction) => {
  const { type, config } = successAction;

  switch (type) {
    case "whatsapp":
      executeWhatsApp(config);
      break;

    case "instagram":
      executeInstagram(config);
      break;

    case "secret_message":
      executeSecretMessage(config);
      break;

    case "secret_location":
      executeSecretLocation(config);
      break;

    default:
      console.log("No success action");
  }
};

const executeWhatsApp = (config) => {
  const phone = config.phone;

  const message = encodeURIComponent(config.message || "");

  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
};

const executeInstagram = (config) => {
  window.open(`https://instagram.com/${config.username}`, "_blank");
};

const executeSecretMessage = (config) => {
  alert(config.message);
};

const executeSecretLocation = (config) => {
  window.open(config.mapLink, "_blank");
};
