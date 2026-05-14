import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authService from "../services/authService";

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  balance: number;
  avatar?: string;
  created_at: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (data: LoginData, {rejectWithValue}) => {
        try {
            const response = await authService.login(data.email, data.password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            return rejectWithValue(message);
        }
    }
);

/**
 * Verify Google ID token and login user
 * Used with Google JavaScript SDK
 */
export const loginWithGoogleIdToken = createAsyncThunk(
    'auth/loginWithGoogleIdToken',
    async (idToken: string, {rejectWithValue}) => {
        try {
            const response = await authService.verifyGoogleIdToken(idToken);
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Đăng nhập bằng Google thất bại.";
            return rejectWithValue(message);
        }
    }
);

/**
 * Exchange Google authorization code for tokens
 * Used in OAuth2 callback flow
 */
export const loginWithGoogleCode = createAsyncThunk(
    'auth/loginWithGoogleCode',
    async (code: string, {rejectWithValue}) => {
        try {
            const response = await authService.exchangeGoogleCode(code);
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Xác thực Google thất bại.";
            return rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },
    extraReducers: (builder) => {
        // Login with email/password
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

        // Login with Google ID Token
        builder
            .addCase(loginWithGoogleIdToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginWithGoogleIdToken.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;
                state.error = null;
            })
            .addCase(loginWithGoogleIdToken.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

        // Login with Google Code
        builder
            .addCase(loginWithGoogleCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginWithGoogleCode.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;
                state.error = null;
            })
            .addCase(loginWithGoogleCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    }
})

export const { logout } = authSlice.actions;
export default authSlice.reducer;
