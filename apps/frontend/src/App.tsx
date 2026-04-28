import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReportsProvider } from "./context/ReportsContext";
import OnboardingPage from "./pages/OnboardingPage";
import MapPage from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ReportHistoryPage from "./pages/ReportHistoryPage";

function App() {
  return (
    <ReportsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/history" element={<ReportHistoryPage />} />
        </Routes>
      </BrowserRouter>
    </ReportsProvider>
  );
}

export default App;
