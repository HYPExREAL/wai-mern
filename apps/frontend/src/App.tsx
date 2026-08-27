import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReportsProvider } from "./context/ReportsContext";
import { NotificationProvider } from "./context/NotificationContext";
import OnboardingPage from "./pages/OnboardingPage";
import MapPage from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ReportHistoryPage from "./pages/ReportHistoryPage";
import AdminStatisticsPage from "./pages/AdminStatisticsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const token = localStorage.getItem("token");

  if (!isAdmin || !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <NotificationProvider>
      <ReportsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OnboardingPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/history" 
              element={
                <ProtectedRoute>
                  <ReportHistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/statistics" 
              element={
                <ProtectedRoute>
                  <AdminStatisticsPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </ReportsProvider>
    </NotificationProvider>
  );
}

export default App;
