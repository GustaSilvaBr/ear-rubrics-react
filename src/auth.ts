// src/auth.ts
export const auth = {
  isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
  signin(callback: VoidFunction) {
    auth.isAuthenticated = true;
    localStorage.setItem("isAuthenticated", "true");
    setTimeout(callback, 100); // fake async
  },
  signout(callback: VoidFunction) {
    auth.isAuthenticated = false;
    localStorage.removeItem("isAuthenticated");
    setTimeout(callback, 100);
  },
};