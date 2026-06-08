// src/themes/themes.js

export const themes = {
  romantic: {
    id: "romantic",
    name: "Romantic Pink",
    icon: "❤️",
    coverImage: "/images/date.jpg",
    primary: "#ff4d88",
    secondary: "#fff0f5",
    accent: "#ff99bb",
  },

  proposal: {
    id: "proposal",
    name: "Proposal Gold",
    icon: "💍",
    coverImage: "/images/proposal.webp",
    primary: "#d4af37",
    secondary: "#fff8dc",
    accent: "#ffd700",
  },

  birthday: {
    id: "birthday",
    name: "Birthday Party",
    icon: "🎂",
    coverImage: "/images/birthday.webp",
    primary: "#6c63ff",
    secondary: "#f4f2ff",
    accent: "#a29bfe",
  },

  wedding: {
    id: "wedding",
    name: "Wedding Elegance",
    icon: "👰",
    coverImage: "/images/wedding.jpeg",
    primary: "#2d3436",
    secondary: "#fdfdfd",
    accent: "#b2bec3",
  },
};

export const eventTypes = [
  "Date Night",
  "Proposal",
  "Birthday",
  "Wedding",
  "Graduation",
  "Party",
  "Church Event",
];