import { useState, useCallback, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import { 
  NotificationContext, 
  type NotificationType, 
  type ConfirmOptions 
} from "./notificationContextDef";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options);
  }, []);

  const handleConfirm = () => {
    confirmOptions?.onConfirm();
    setConfirmOptions(null);
  };

  const handleCancel = () => {
    confirmOptions?.onCancel?.();
    setConfirmOptions(null);
  };

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}

      <div className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 z-10000 flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div 
            key={n.id}
            className={`pointer-events-auto flex items-center gap-3 md:gap-4 px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-24px shadow-2xl border backdrop-blur-xl text-sm ${
              n.type === "success" 
                ? "bg-[#16A34A]/90 border-white/20 text-white" 
                : n.type === "error"
                ? "bg-red-500/90 border-white/20 text-white"
                : "bg-white/90 border-gray-100 text-[#003B6D]"
            }`}
          >
            {n.type === "success" ? <CheckCircle size={20} /> : n.type === "error" ? <XCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="text-sm font-bold tracking-tight">{n.message}</span>
            <button 
              onClick={() => setNotifications((prev) => prev.filter((notif) => notif.id !== n.id))}
              className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmOptions && (
        <div className="fixed inset-0 z-10000 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-[#003B6D]/40 backdrop-blur-md" onClick={handleCancel} />
          <div className="relative bg-white w-full max-w-sm rounded-t-32px md:rounded-[40px] shadow-2xl p-6 md:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-[#003B6D] mb-2">{confirmOptions.title}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">{confirmOptions.message}</p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={handleCancel}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-3xl font-bold hover:bg-gray-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                {confirmOptions.cancelText || "Batal"}
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-4 bg-[#005a9e] text-white rounded-3xl font-bold hover:bg-[#004a82] shadow-xl shadow-[#005a9e]/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                {confirmOptions.confirmText || "Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
