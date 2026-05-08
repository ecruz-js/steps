import { useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FullScreenLoader } from "@/pages/admin/AdminLogin";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Productos", icon: Package },
  { to: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/settings", label: "Ajustes", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div data-testid="admin-layout" className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.06] bg-[#0A0A0A]">
        <div className="px-6 py-7 flex items-center gap-3 border-b border-white/[0.06]">
          <span className="h-9 w-9 rounded-md bg-white text-black font-bold font-display flex items-center justify-center">
            S
          </span>
          <div className="flex-1">
            <div className="font-display text-sm tracking-tight">Safe Steps</div>
            <div className="label-eyebrow !text-[0.55rem]">Admin</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`admin-nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            data-testid="admin-view-site"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/5 transition"
          >
            <ExternalLink size={14} />
            Ver sitio
          </a>
          <button
            onClick={handleLogout}
            data-testid="admin-logout-button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/55 hover:text-red-300 hover:bg-red-500/10 transition"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 px-4 flex items-center justify-between bg-[#0A0A0A]/95 border-b border-white/[0.06] backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded bg-white text-black font-bold flex items-center justify-center text-xs">
            S
          </span>
          <span className="font-display text-sm">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          data-testid="admin-mobile-menu"
          className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="font-display">Admin</span>
              <button onClick={() => setMobileOpen(false)} className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      isActive ? "bg-white/10" : "text-white/55 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="m-3 px-3 py-2.5 rounded-lg text-sm text-white/55 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
