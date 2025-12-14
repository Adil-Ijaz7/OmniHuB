import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tv,
  Mail,
  Youtube,
  ImageIcon,
  Phone,
  Search,
  LayoutDashboard,
  Users,
  Coins,
  FileText,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  History,
  Smartphone,
} from "lucide-react";

const userTools = [
  { name: "Live TV", path: "/tools/live-tv", icon: Tv, cost: 1 },
  { name: "Tamasha OTP", path: "/tools/tamasha-otp", icon: Smartphone, cost: 2 },
  { name: "Temp Email", path: "/tools/temp-email", icon: Mail, cost: 1 },
  { name: "YouTube Download", path: "/tools/youtube-downloader", icon: Youtube, cost: 3 },
  { name: "Image Enhance", path: "/tools/image-enhance", icon: ImageIcon, cost: 2 },
  { name: "Phone Lookup", path: "/tools/phone-lookup", icon: Phone, cost: 1 },
  { name: "Eyecon Lookup", path: "/tools/eyecon-lookup", icon: Search, cost: 1 },
];

const adminLinks = [
  { name: "Admin Dashboard", path: "/admin", icon: Shield },
  { name: "Manage Users", path: "/admin/users", icon: Users },
  { name: "Manage Credits", path: "/admin/credits", icon: Coins },
  { name: "View Logs", path: "/admin/logs", icon: FileText },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-3" data-testid="logo-link">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center glow-primary">
                <span className="text-xl font-bold text-primary-foreground">O</span>
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-foreground">OmniHub</h1>
                <p className="text-xs text-muted-foreground">Digital Command Center</p>
              </div>
            </Link>
          </div>

          {/* Credit Display */}
          <div className="p-4 mx-4 mt-4 rounded-lg glass">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Available Credits</p>
            <p className="text-3xl font-mono font-bold text-primary credit-counter" data-testid="credit-balance">
              {user?.credits?.toLocaleString() || 0}
            </p>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            {/* Main Tools */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 px-3">Tools</p>
              <nav className="space-y-1">
                <Link
                  to="/dashboard"
                  data-testid="nav-dashboard"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive("/dashboard")
                      ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                {userTools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    data-testid={`nav-${tool.path.split("/").pop()}`}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      isActive(tool.path)
                        ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <tool.icon className="w-5 h-5" />
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive(tool.path) ? "bg-primary-foreground/20" : "bg-muted"
                    }`}>
                      {tool.cost}
                    </span>
                  </Link>
                ))}
                <Link
                  to="/usage-history"
                  data-testid="nav-usage-history"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive("/usage-history")
                      ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span className="font-medium">Usage History</span>
                </Link>
              </nav>
            </div>

            {/* Admin Section */}
            {user?.role === "admin" && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 px-3">Admin</p>
                <nav className="space-y-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      data-testid={`nav-${link.path.split("/").pop()}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive(link.path)
                          ? "bg-accent text-accent-foreground shadow-lg"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
                className="flex-1"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                data-testid="logout-btn"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">O</span>
            </div>
            <span className="font-heading font-bold">OmniHub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-primary" data-testid="mobile-credits">
              {user?.credits || 0}
            </span>
            <Coins className="w-4 h-4 text-primary" />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
