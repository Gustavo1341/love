// src/utils/index.js
export const createPageUrl = (pageName) => {
    if (pageName === "Home") {
      return "/";
    }
    return `/${pageName.toLowerCase()}`;
  };