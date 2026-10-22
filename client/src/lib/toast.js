import "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
export const toast = ToastPrimitive.createToastManager();
export const createToastManager = ToastPrimitive.createToastManager;
export const useToastManager = ToastPrimitive.useToastManager;
