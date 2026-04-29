import { createContext, useContext } from "react";

export type NotificationType = "success" | "error" | "info";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface NotificationContextType {
  notify: (type: NotificationType, message: string) => void;
  confirm: (options: ConfirmOptions) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
