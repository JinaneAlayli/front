import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  user: any
  isAuthenticated: boolean
  isAuthChecked: boolean
}

// Initial state without localStorage persistence
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAuthChecked: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<any>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isAuthChecked = true
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isAuthChecked = true
    },
    setAuthChecked: (state) => {
      state.isAuthChecked = true
    },
    updateUser: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
})

export const { loginSuccess, logout, setAuthChecked, updateUser } = authSlice.actions
export default authSlice.reducer
