"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { loadCurrentUser } from "./authSlice";
import { loadCart } from "./cartSlice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void Promise.all([store.dispatch(loadCurrentUser()), store.dispatch(loadCart())]);
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
