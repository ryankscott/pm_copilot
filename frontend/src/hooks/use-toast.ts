import { toast } from "sonner";

export const useToast = () => {
  return {
    toast: toast,
    success: (message: string, description?: string) => {
      toast.success(message, {
        description,
      });
    },
    error: (message: string, description?: string) => {
      toast.error(message, {
        description,
      });
    },
    info: (message: string, description?: string) => {
      toast.info(message, {
        description,
      });
    },
    warning: (message: string, description?: string) => {
      toast.warning(message, {
        description,
      });
    },
    loading: (message: string) => {
      return toast.loading(message);
    },
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => {
      return toast.promise(promise, {
        loading,
        success,
        error,
      });
    },
  };
};
