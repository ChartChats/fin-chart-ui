import axios from '@/store/client';
import { BaseQueryFn } from '@reduxjs/toolkit/query';

export const clientBaseQuery: BaseQueryFn = async ({ url, method, data, params }) => {
  try {
    const result = await axios({
      url,
      method,
      data,
      params,
    });

    return {
      data: result.data
    };
  } catch (axiosError: any) {
    const err = axiosError;
    // Don't retry on 4xx errors (client errors)
    if (err.response?.status >= 400 && err.response?.status < 500) {
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
    // For 5xx errors (server errors), let RTK Query handle retries
    return {
      error: {
        status: err.response?.status || 500,
        data: err.response?.data || err.message,
      },
    };
  }
};