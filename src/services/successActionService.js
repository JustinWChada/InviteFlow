export const executeSuccessAction = (successAction) => {
  const { type, config } = successAction || {};

  // If this is a secret action mapped to WhatsApp, treat it accordingly
  if (config && config.secret) {
    // secretKind: 'message' | 'location'
    executeWhatsAppForSecret(config);
    return;
  }

  switch (type) {
    case "whatsapp":
      executeWhatsApp(config);
      break;

    case "instagram":
      executeInstagram(config);
      break;

    default:
      console.log("No success action");
  }
};

const executeWhatsApp = (config) => {
  const phone = config.phone;
  const message = encodeURIComponent(config.message || "");
  if (!phone) return;
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

const executeWhatsAppForSecret = (config) => {
  const phone = config.phone;
  if (!phone) return;

  const kind = config.secretKind || 'message';

  let text = '';

  if (kind === 'location') {
    // Prefer explicit mapLink, fallback to secretMessage
    text = config.mapLink || config.secretMessage || config.message || '';
    if (!text) text = 'A guest accepted and requested the secret location.';
  } else {
    // secret message
    text = config.secretMessage || config.message || '';
    if (!text) text = 'A guest accepted and requested the secret message.';
  }

  const message = encodeURIComponent(text);

  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
};
