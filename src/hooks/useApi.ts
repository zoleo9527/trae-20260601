import { useState, useEffect } from 'react';
import api from '../services/api';

export function useApi<T>(url: string, params?: any) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(url, { params });
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}

export function useMutation<T, R>(url: string, method: 'post' | 'put' | 'delete' = 'post') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data?: T): Promise<R> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api({
        method,
        url,
        data,
      });
      return response.data.data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
