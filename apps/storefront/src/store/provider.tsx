"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { setAuthLoading, setUser } from "./authSlice";
import api from "@/lib/api";

type MeResponse = { data: { user: Parameters<typeof setUser>[0] } };

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let active = true;

    void api.get<MeResponse>("/auth/me")
      .then((response) => {
        if (active) store.dispatch(setUser(response.data.user));
      })
      .catch(() => {
        if (active) store.dispatch(setAuthLoading(false));
      });

    return () => {
      active = false;
    };
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
