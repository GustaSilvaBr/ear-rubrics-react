// src/auth.ts
export const auth = {
  isAuthenticated: false,
  signin(callback: VoidFunction) {
    auth.isAuthenticated = true;
    setTimeout(callback, 100); // fake async
  },
  signout(callback: VoidFunction) {
    auth.isAuthenticated = false;
    setTimeout(callback, 100);
  },
};