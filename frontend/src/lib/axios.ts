import axios from 'axios'
import { supabase } from './supabase'

const instance = axios.create({
  baseURL: '/api/v1'
})

// Add auth token to requests
instance.interceptors.request.use(async (config) => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    return Promise.reject(error)
  }

  if (!session) {
    // If no session, redirect to login
    window.location.href = '/login'
    return Promise.reject(new Error('No active session'))
  }

  config.headers.Authorization = `Bearer ${session.access_token}`
  return config
})

// Handle auth errors
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, sign out and redirect to login
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance 