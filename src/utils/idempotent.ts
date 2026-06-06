import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

export const generateIdempotencyKey = (prefix: string = 'key'): string => {
  return `${prefix}-${uuidv4()}`;
};

interface UseIdempotentSubmitOptions<T> {
  action: (data: T & { idempotencyKey: string }) => Promise<any>;
  onSuccess?: (data: any, isDuplicate: boolean) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  duplicateMessage?: string;
}

interface UseIdempotentSubmitResult<T> {
  loading: boolean;
  idempotencyKey: string;
  submit: (data: T) => Promise<void>;
  reset: () => void;
}

export function useIdempotentSubmit<T = any>(
  options: UseIdempotentSubmitOptions<T>,
): UseIdempotentSubmitResult<T> {
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  const submit = useCallback(
    async (data: T) => {
      if (loading) return;

      setLoading(true);
      try {
        const result = await options.action({
          ...data,
          idempotencyKey,
        });

        if (result.isDuplicate) {
          message.warning(options.duplicateMessage || '重复提交，已忽略');
        } else {
          if (options.successMessage) {
            message.success(options.successMessage);
          }
        }

        options.onSuccess?.(result.data, result.isDuplicate);
        setIdempotencyKey(generateIdempotencyKey());
      } catch (e: any) {
        message.error(e.message || '操作失败');
        options.onError?.(e);
      } finally {
        setLoading(false);
      }
    },
    [loading, idempotencyKey, options],
  );

  const reset = useCallback(() => {
    setIdempotencyKey(generateIdempotencyKey());
    setLoading(false);
  }, []);

  return {
    loading,
    idempotencyKey,
    submit,
    reset,
  };
}
