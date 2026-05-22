import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import restaurantReducer from "../features/restaurantSlice";
import mapReducer from "../features/mapSlice";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        restaurants: restaurantReducer,
        map: mapReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;