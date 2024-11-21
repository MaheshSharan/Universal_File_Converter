import axiosInstance from '../utils/axiosConfig';

const API_URL = 'http://localhost:3000/api';

// Create axios instance with credentials
// const api = axios.create({
//   baseURL: API_URL,
//   withCredentials: true
// });

export const getGoogleAuthUrl = async () => {
  try {
    const response = await axiosInstance.get('/auth/google/url');
    return response.data.url;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw new Error('Failed to get authentication URL');
  }
};

export const checkAuthStatus = async () => {
  try {
    const response = await axiosInstance.get('/auth/status');
    return response.data;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false };
  }
};

export const getUserInfo = async () => {
  try {
    const response = await axiosInstance.get('/auth/user');
    return response.data;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw new Error('Failed to get user information');
  }
};

export const logout = async () => {
  try {
    await axiosInstance.post('/auth/logout');
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to logout');
  }
};
