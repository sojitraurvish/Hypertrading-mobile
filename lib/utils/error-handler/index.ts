import { appToast } from "@/components/ui/app-toast";

type ApiErrorShape = {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
  code?: string;
};

type RegularErrorShape = {
  message?: string;
  name?: string;
};

const includesText = (value: string | undefined, search: string) =>
  value?.toLowerCase().includes(search.toLowerCase()) ?? false;

export const errorHandler = (error: unknown, customTitle?: string) => {
  const apiError = error as ApiErrorShape;
  const regularError = error as RegularErrorShape;

  const status = apiError.response?.status;
  const statusText = apiError.response?.statusText;

  const fallbackMessage = "An unknown error occurred.";
  const errorMessage =
    apiError.response?.data?.message ||
    apiError.response?.data?.error ||
    apiError.message ||
    regularError.message ||
    fallbackMessage;

  let title = customTitle || "Error";
  let message = errorMessage;

  if (status === 429) {
    title = "Too Many Requests";
    message = "You made too many requests. Please wait and try again.";
  } else if (status === 401) {
    title = "Unauthorized";
    message = "Your session expired. Please reconnect and try again.";
  } else if (status === 403) {
    title = "Forbidden";
    message = "You do not have permission to perform this action.";
  } else if (status === 404) {
    title = "Not Found";
    message = "The requested resource was not found.";
  } else if (status === 500) {
    title = "Server Error";
    message = "Something went wrong on the server. Please try again later.";
  } else if (status === 503) {
    title = "Service Unavailable";
    message = "The service is temporarily unavailable. Please try again later.";
  } else if (status && status >= 400) {
    title = `Error ${status}`;
    message = statusText || errorMessage;
  } else if (
    apiError.code === "ECONNABORTED" ||
    includesText(errorMessage, "timeout")
  ) {
    title = "Request Timeout";
    message = "The request timed out. Check your connection and retry.";
  } else if (
    apiError.code === "ERR_NETWORK" ||
    includesText(errorMessage, "network")
  ) {
    title = "Network Error";
    message = "Unable to reach the server. Check your internet connection.";
  }

  appToast.error({ title, message });
  return message;
};

export default errorHandler;
