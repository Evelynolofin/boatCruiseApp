import axios from 'axios';
import { getToken } from '../constants/tokenFile';

export const httpClient = axios.create({
  baseURL: 'https://internsproject.vercel.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    console.log(await getToken)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
