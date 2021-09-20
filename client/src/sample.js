import massEffect from "./assets/img/covers/mass-effect.jpg";
import ddlcplus from "./assets/img/covers/ddlc-plus.jpg";
import re3 from "./assets/img/covers/RE-3.jpg";
import cyberpunk from "./assets/img/covers/artur-tarnowski-malemain.jpg";

const games = [
  {
    title: "Mass Effect Legendary Edition",
    wishlist: 255,
    price: {
      highest: "Rp 699 999",
      lowest: "Rp 289 999",
    },
    discount: 60,
    cover: massEffect,
    tags: ["RPG", "Story Rich", "Choices Matter", "Sci-fi", "Action"],
    platforms: ["windows"],
  },
  {
    title: "Cyberpunk 2077",
    wishlist: 700,
    price: {
      highest: "Rp 789 999",
      lowest: "Rp 789 999",
    },
    discount: 0,
    cover: cyberpunk,
    tags: ["Cyverpunk", "Open World", "RPG", "Sci-fi", "Futuristic"],
    platforms: ["windows"],
  },
  {
    title: "Resident Evil 3",
    wishlist: 69,
    price: {
      highest: "Rp 1 139 999",
      lowest: "Rp 689 999",
    },
    discount: 55,
    cover: re3,
    tags: ["Action", "Zombies", "Horror", "Female Protagonist",],
    platforms: ["windows", "apple"],
  },
  {
    title: "Doki Doki Literature Club Plus",
    wishlist: 999,
    price: {
      highest: "Rp 119 999",
      lowest: "Rp 119 999",
    },
    discount: 0,
    cover: ddlcplus,
    tags: ["Psychological Horror", "Visual Novel", "Anime", "Cute",],
    platforms: ["windows", "apple", "steam"],
  },
];

export default games;