import axios from '@/store/client';
import { BaseQueryFn } from '@reduxjs/toolkit/query';

export const clientBaseQuery: BaseQueryFn = async ({ url, method, data, params }) => {
  console.log('Making request:', { url, method, data, params });
  
  // Always ensure we return a proper response object
  if (!url) {
    return {
      error: {
        status: 400,
        data: 'URL is required',
      },
    };
  }

  try {
    const result = await axios({
      url,
      method: method || 'GET', // Default to GET if method not specified
      data,
      params,
    });

    console.log('Request successful:', result.data);
    return {
      data: result.data
    };
  } catch (axiosError: any) {
    const err = axiosError;
    console.error('Request failed:', { 
      status: err.response?.status,
      data: err.response?.data,
      message: err.message 
    });
    
    return {
      error: {
        status: err.response?.status || 500,
        data: err.response?.data || err.message,
      },
    };
  }
};