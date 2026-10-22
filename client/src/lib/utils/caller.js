"use client";

import { useCallback } from "react";
import {
  useMutation as useMutationDefault,
  useQuery as useQueryDefault,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { toast as toastManager } from "@/lib/toast";
import { apiBaseUrl } from "@/lib/config/api";
export class CallerError extends Error {
  constructor(message, options = {}) {
    super(message, {
      cause: options.cause,
    });
    this.name = "CallerError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

// Definition helpers intentionally mirror RTK Query's builder-style API.
export function useQuery(definition) {
  return definition;
}
export function useMutation(definition) {
  return definition;
}
export const callerClient = axios.create({
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});
function hasFetchOptions(options) {
  return Object.values(options).some((value) => value !== undefined);
}
function getResponseType(handler, responseType) {
  if (responseType || typeof handler !== "string") return responseType;
  if (handler === "arrayBuffer") return "arraybuffer";
  if (handler === "content-type") return undefined;
  return handler;
}
function unwrapResponse(payload, unwrapData) {
  if (
    unwrapData &&
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return payload.data;
  }
  return payload;
}
async function handleResponse(response, handler, unwrapData) {
  if (typeof handler === "function") return handler(response);
  return unwrapResponse(response.data, unwrapData);
}
function getErrorMessage(details) {
  if (typeof details === "string" && details.trim()) return details;
  if (!details || typeof details !== "object") return undefined;
  const nestedError = details.error;
  if (typeof details.message === "string" && details.message.trim())
    return details.message;
  if (
    typeof details.error_description === "string" &&
    details.error_description.trim()
  )
    return details.error_description;
  if (typeof nestedError === "string" && nestedError.trim()) return nestedError;
  if (
    nestedError &&
    typeof nestedError === "object" &&
    typeof nestedError.message === "string" &&
    nestedError.message.trim()
  ) {
    return nestedError.message;
  }
  return undefined;
}
function getErrorCode(details) {
  if (!details || typeof details !== "object") return undefined;
  if (typeof details.code === "string") return details.code;
  if (typeof details.error === "string") return details.error;
  return undefined;
}
export function normalizeCallerError(error) {
  if (error instanceof CallerError) return error;
  if (axios.isAxiosError(error)) {
    const details = error.response?.data;
    return new CallerError(
      getErrorMessage(details) ?? error.message ?? "Request failed",
      {
        status: error.response?.status,
        code: getErrorCode(details) ?? error.code,
        details,
        cause: error,
      },
    );
  }
  if (error instanceof Error) {
    return new CallerError(error.message || "Request failed", {
      details: error,
      cause: error,
    });
  }
  return new CallerError(getErrorMessage(error) ?? "Request failed", {
    details: error,
    cause: error,
  });
}
function resolveToastMessage(value, input) {
  return typeof value === "function" ? value(input) : value;
}
function notifySuccess(option, data) {
  if (!option || option === true) return;
  const message = resolveToastMessage(option.success, data);
  if (message)
    toastManager.add({
      title: message,
      type: "success",
    });
}
function notifyError(option, error) {
  if (!option) return;
  const message =
    option === true
      ? error.message
      : (resolveToastMessage(option.error, error) ?? error.message);
  toastManager.add({
    title: message,
    type: "error",
  });
}
export async function caller(options) {
  const {
    url,
    method = "GET",
    params,
    query,
    body,
    baseURL,
    auth = true,
    unwrapData = true,
    schema,
    toast,
    onSuccess,
    onError,
    responseType,
    responseHandler,
    cache,
    credentials,
    integrity,
    keepalive,
    mode,
    next,
    priority,
    redirect,
    referrer,
    referrerPolicy,
    window,
    ...config
  } = options;

  // Reserved for an application-level authentication retry interceptor.
  void auth;
  const fetchOptions = {
    ...config.fetchOptions,
    cache,
    credentials,
    integrity,
    keepalive,
    mode,
    next,
    priority,
    redirect,
    referrer,
    referrerPolicy,
    window,
  };
  const methodName = String(method).toUpperCase();
  const hasUnsupportedFetchBody =
    (methodName === "GET" || methodName === "HEAD") && body !== undefined;
  const useFetchAdapter =
    hasFetchOptions(fetchOptions) && !hasUnsupportedFetchBody;
  try {
    const response = await callerClient.request({
      ...config,
      adapter: config.adapter ?? (useFetchAdapter ? "fetch" : undefined),
      baseURL: baseURL === null ? undefined : (baseURL ?? apiBaseUrl),
      url,
      method,
      params: query ?? params,
      data: body,
      responseType: getResponseType(responseHandler, responseType),
      withCredentials:
        credentials === undefined
          ? (config.withCredentials ?? true)
          : credentials === "include",
      fetchOptions,
    });
    if (response.status === 204) {
      await onSuccess?.(null);
      notifySuccess(toast, null);
      return null;
    }
    const responseData = await handleResponse(
      response,
      responseHandler,
      unwrapData,
    );
    const data = schema ? await schema.parseAsync(responseData) : responseData;
    await onSuccess?.(data);
    notifySuccess(toast, data);
    return data;
  } catch (error) {
    const normalizedError = normalizeCallerError(error);
    await onError?.(normalizedError);
    notifyError(toast, normalizedError);
    throw normalizedError;
  }
}
export function useCallerQuery(options) {
  const { queryKey, queryOptions, ...requestOptions } = options;
  return useQueryDefault({
    ...queryOptions,
    queryKey,
    queryFn: ({ signal }) =>
      caller({
        ...requestOptions,
        signal: requestOptions.signal ?? signal,
      }),
  });
}
export function useCallerMutation(options) {
  const { mutationOptions, mapVariables, ...requestOptions } = options;
  return useMutationDefault({
    ...mutationOptions,
    mutationFn: (variables) =>
      caller(
        mapVariables ? mapVariables(variables, requestOptions) : requestOptions,
      ),
  });
}
export function createQueryService(definition) {
  return function useDefinedQuery(arg, hookOptions = {}) {
    const request =
      typeof definition.query === "function"
        ? definition.query(arg)
        : definition.query;
    const queryKey =
      typeof definition.queryKey === "function"
        ? definition.queryKey(arg)
        : definition.queryKey;
    return useCallerQuery({
      ...request,
      queryKey,
      queryOptions: {
        ...definition.queryOptions,
        ...hookOptions,
      },
    });
  };
}
export function createMutationService(definition) {
  return function useDefinedMutation(hookOptions = {}) {
    const queryClient = useQueryClient();
    const configuredOptions = {
      ...definition.mutationOptions,
      ...hookOptions,
    };
    const mutation = useMutationDefault({
      ...configuredOptions,
      mutationFn: (variables) => {
        const request =
          typeof definition.query === "function"
            ? definition.query(variables)
            : definition.query;
        return caller(request);
      },
      onSuccess: async (data, variables, result, context) => {
        await configuredOptions.onSuccess?.(data, variables, result, context);
        const queryKeys =
          typeof definition.invalidates === "function"
            ? definition.invalidates(data, variables)
            : definition.invalidates;
        if (queryKeys) {
          await Promise.all(
            queryKeys.map((queryKey) =>
              queryClient.invalidateQueries({
                queryKey,
              }),
            ),
          );
        }
      },
    });
    const { mutateAsync } = mutation;
    const trigger = useCallback(
      (variables) => {
        const promise = mutateAsync(variables);
        void promise.catch(() => undefined);
        return {
          unwrap: () => promise,
        };
      },
      [mutateAsync],
    );
    return [
      trigger,
      {
        ...mutation,
        isLoading: mutation.isPending,
        isUninitialized: mutation.status === "idle",
      },
    ];
  };
}
function requestWithMethod(method, url, body, options = {}) {
  return caller({
    ...options,
    url,
    method,
    ...(body === undefined
      ? {}
      : {
          body,
        }),
  });
}
export const http = {
  request: caller,
  get(url, options = {}) {
    return requestWithMethod("GET", url, undefined, options);
  },
  post(url, body, options = {}) {
    return requestWithMethod("POST", url, body, options);
  },
  put(url, body, options = {}) {
    return requestWithMethod("PUT", url, body, options);
  },
  patch(url, body, options = {}) {
    return requestWithMethod("PATCH", url, body, options);
  },
  delete(url, options = {}) {
    return requestWithMethod("DELETE", url, options.body, options);
  },
  head(url, options = {}) {
    return requestWithMethod("HEAD", url, undefined, options);
  },
  options(url, options = {}) {
    return requestWithMethod("OPTIONS", url, options.body, options);
  },
};
