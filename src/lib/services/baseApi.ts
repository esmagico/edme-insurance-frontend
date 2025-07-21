import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../config';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: config.api.baseUrl,
    prepareHeaders: (headers) => {
      // Add default headers here
      headers.set('Content-Type', 'application/json');
      
      // Example: Add authorization token
      // const token = localStorage.getItem('token');
      // if (token) {
      //   headers.set('authorization', `Bearer ${token}`);
      // }
      
      return headers;
    },
  }),
  endpoints: () => ({}),
  tagTypes: ['Posts', 'Users'], // Add your cache tags here
}); 