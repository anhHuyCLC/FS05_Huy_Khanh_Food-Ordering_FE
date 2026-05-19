import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authService from "../services/authService";
import { normalizeUser } from "../lib/authPayload";

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING';

export interface UserRole {
  code: string;
  name: string;
}

export interface UserPermission {
  code: string;
  name: string;
  feature?: string | null;
}

export interface UserProfile {
  rewardPoints?: number;
  badgeLevel?: string;
}

export interface User {
  id: string;

  email: string;

  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;

  avatarUrl?: string | null;

  phoneNumber?: string | null;
  address?: string | null;
  gender?: string | null;

  status: UserStatus;

  profile?: UserProfile | null;

  roles: UserRole[];

  permissions: UserPermission[];

  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
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
  user: (() => {
    try {
      const user = localStorage.getItem('user');
      return (user && user !== 'undefined') ? normalizeUser(JSON.parse(user)) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (data: LoginData, {rejectWithValue}) => {
        try {
            const responseData: AuthResponse = await authService.login(data.email, data.password);
            localStorage.setItem('token', responseData.accessToken);
            localStorage.setItem('refreshToken', responseData.refreshToken);
            localStorage.setItem('user', JSON.stringify(responseData.user));
            return responseData;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            return rejectWithValue(message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (data: { email: string; password: string; confirmpassword: string; firstname: string; middlename: string; lastname: string; phonenumber: string; address: string, role: string }, {rejectWithValue}) => {
        try {
            const response = await authService.register(data);
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Đăng ký thất bại. Vui lòng thử lại.";
            return rejectWithValue(message);
        }
    }
);

export const loginWithGoogleIdToken = createAsyncThunk(
    'auth/loginWithGoogleIdToken',
    async (idToken: string, {rejectWithValue}) => {
        try {
            const payload = await authService.verifyGoogleIdToken(idToken);
            const token = payload.accessToken;
            localStorage.setItem('token', token);
            if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
            localStorage.setItem('user', JSON.stringify(payload.user));
            console.log(payload.user);
            return payload;
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
            const payload = await authService.exchangeGoogleCode(code);
            const token = payload.accessToken;
            localStorage.setItem('token', token);
            if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
            localStorage.setItem('user', JSON.stringify(payload.user));
            return payload;
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
        },
        setAuthData: (state, action) => {
            state.user = action.payload.user ? normalizeUser(action.payload.user) : null;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.error = null;
            if (action.payload.token) localStorage.setItem('token', action.payload.token);
            if (action.payload.refreshToken) localStorage.setItem('refreshToken', action.payload.refreshToken);
            if (action.payload.user) localStorage.setItem('user', JSON.stringify(normalizeUser(action.payload.user)));
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
                state.token = action.payload.accessToken;
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
        // Register
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
})

export const { logout, setAuthData } = authSlice.actions;
export default authSlice.reducer;
