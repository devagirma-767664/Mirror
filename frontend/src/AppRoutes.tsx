// AppRoutes.tsx
import React, {lazy,Suspense} from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import PlatformHome from "./Dashboard/Public/pages/PlatformHome";
import SignupPage from "./Dashboard/Public/pages/SignupPage";
import ShopPage from "./Dashboard/Public/pages/ShopPage";
import StoreSetup from "./Components/Admin/StoreSetup";
import WorkspaceAccess from "./Components/WorkspaceAccess";
import LoginPage from "./Dashboard/Public/pages/LoginPage";
const AdminDashboard=lazy(()=>import('./Dashboard/Admin/AdminDashboard'));
const BookingPage=lazy(()=>import('./Dashboard/Public/pages/BookingPage'));
const BarberDashboard=lazy(()=>import('./Dashboard/Barber/BarberDashboard'));
const ReceptionistDashboard=lazy(()=>import('./Dashboard/Reception/ReceptionistDashboard'));
const PlatformDashboard=lazy(()=>import('./Dashboard/Platform/PlatformDashboard'));
import PublicFeatureGate from "./Components/Landing Page/PublicFeatureGate";
import { useAppSelector } from "./app/hooks";

const RootPublicPage=()=>{
  const domain=String(import.meta.env.VITE_PUBLIC_WEBSITE_DOMAIN||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
  const host=window.location.hostname.toLowerCase(),suffix=domain?`.${domain}`:'',candidate=suffix&&host.endsWith(suffix)?host.slice(0,-suffix.length):'';
  const isShopSubdomain=!!candidate&&candidate.split('.').length===1&&!['www','app','api','admin','platform'].includes(candidate);
  return isShopSubdomain?<ShopPage/>:<PlatformHome/>;
};

type WorkspaceRole = "admin" | "barber" | "receptionist" | "platform_admin";

const RoleRoute: React.FC<{ role: WorkspaceRole; children: React.ReactNode }> = ({ role, children }) => {
  const user = useAppSelector((state) => state.auth.user);
  const location=useLocation();
  if (!user) return <Navigate to="/login" state={{from:location.pathname+location.search}} replace />;
  const currentRole = String(user.role || "").toLowerCase();
  if (currentRole === role) return <WorkspaceAccess>{children}</WorkspaceAccess>;
  const ownWorkspace: Record<string, string> = { admin: "/admin", barber: "/barber", receptionist: "/receptionist", platform_admin: "/platform", customer: "/booking" };
  return <Navigate to={ownWorkspace[currentRole] || "/login"} replace />;
};

class AdminDashboardBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Admin workspace failed to render", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Admin page could not open</h1>
            <p className="text-gray-600 mb-5">Refresh the page and try again. If it still does not open, share this message:</p>
            <code className="block bg-gray-100 rounded-lg p-3 text-left text-sm text-red-600 break-words">
              {this.state.error.message}
            </code>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<main className="saas-access-state">Opening your page…</main>}><Routes>
      <Route path="/" element={<RootPublicPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/s/:shopSlug" element={<ShopPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/barber/login" element={<Navigate to="/login" replace />} />
      <Route path="/reception/login" element={<Navigate to="/login" replace />} />

      <Route path="/admin" element={<RoleRoute role="admin"><AdminDashboardBoundary><AdminDashboard /></AdminDashboardBoundary></RoleRoute>} />
      <Route path="/admin/setup" element={<RoleRoute role="admin"><StoreSetup /></RoleRoute>} />
      <Route path="/booking" element={<PublicFeatureGate feature="onlineBooking"><BookingPage /></PublicFeatureGate>} />
      <Route path="/s/:shopSlug/booking" element={<PublicFeatureGate feature="onlineBooking"><BookingPage /></PublicFeatureGate>} />
      <Route path="/barber" element={<RoleRoute role="barber"><BarberDashboard /></RoleRoute>} />
      <Route path="/receptionist" element={<RoleRoute role="receptionist"><ReceptionistDashboard /></RoleRoute>} />
      <Route path="/platform" element={<RoleRoute role="platform_admin"><PlatformDashboard /></RoleRoute>} />
      <Route path="*" element={<main className="saas-access-state"><h1>Page not found</h1><a href="/">Go to Mirror</a></main>} />
    </Routes></Suspense>
  );
};

export default AppRoutes;
