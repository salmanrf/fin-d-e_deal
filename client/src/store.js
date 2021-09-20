import create from "zustand";

export const userStore = create((set) => ({
  user: null,
  token: null,
  wishlists: [],
  wishlistCount: 0,
  setUser: (user) => set({
      user, 
      wishlists: (user || {wishlists: []}).wishlists, 
      wishlistCount: (user || {wishlistCount: 0}).wishlistCount
  }),
  setToken: (token) => set({token}),
  addToWishlist: (gameid) => (
    set(({wishlists, wishlistCount}) => ({
      wishlists: [...wishlists, {_id: gameid + ""}],
      wishlistCount: wishlistCount + 1   
    }))
  ),
  removeFromWishlist: (gameid) => (
    set(({wishlists, wishlistCount}) => ({
      wishlists: wishlists.filter((w) => w._id + "" !== gameid + ""),
      wishlistCount: wishlistCount - 1
    }))
  )
}));

export const layoutStore = create((set) => ({
  showLoginForm: false,
  showSignupForm: false,
  setShowLoginForm: (show) => set(() => ({showLoginForm: show})),
  setShowSignupForm: (show) => set(() => ({showSignupForm: show}))
}));

