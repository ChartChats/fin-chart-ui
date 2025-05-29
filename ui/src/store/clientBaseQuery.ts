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
    return { data: result.data };
  } catch (axiosError: any) {
    const err = axiosError;
    return {
      error: {
        status: err.response?.status || 500,
        data: err.response?.data || err.message,
      },
    };
  }
};