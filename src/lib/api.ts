import axios from "axios"

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
})


// Add request interceptor to handle common request tasks
api.interceptors.request.use(
  (config) => {
    // You can modify the request config here
    return config
  },
  (error) => {
    // Handle request errors silently in development
    console.log("API Request Error:", error.message)
    return Promise.reject(error)
  },
)

// Add response interceptor to handle common response tasks
api.interceptors.response.use(
  (response) => {
    // You can modify the response data here
    return response
  },
  (error) => {
    // Don't show network errors in the console during development
    if (error.message === "Network Error") {
      console.log("API Network Error - Silent handling")
      return Promise.reject(new Error("Unable to connect to the server. Please check your connection."))
    }

    // Handle timeout errors gracefully
    if (error.code === "ECONNABORTED") {
      console.log("API Timeout Error - Silent handling")
      return Promise.reject(new Error("Request timed out. Please try again later."))
    }

    // For other errors, we can still log them but with a cleaner message
    console.log("API Error:", error.response?.status || error.message)

    return Promise.reject(error)
  },
)

export default api
