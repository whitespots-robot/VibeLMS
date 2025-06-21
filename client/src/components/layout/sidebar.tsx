import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, LayoutDashboard, BookOpen, Users, FolderOpen, 
  BarChart3, Download, User, Play, Settings, LogOut, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const getNavigation = (userRole: string | null) => {
  if (userRole === 'instructor') {
    return [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'My Courses', href: '/courses', icon: BookOpen },
      { name: 'Students', href: '/students', icon: Users },
      { name: 'Materials', href: '/materials', icon: FolderOpen },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Export', href: '/export', icon: Download },
      { name: 'User Management', href: '/users', icon: Settings },
    ];
  } else {
    return [
      { name: 'My Learning', href: '/learning', icon: Play },
    ];
  }
};

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: { 
  isMobileOpen?: boolean; 
  setIsMobileOpen?: (open: boolean) => void; 
}) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get current user from localStorage
  const currentUserData = localStorage.getItem("currentUser");
  const currentUser = currentUserData && currentUserData !== "undefined" ? JSON.parse(currentUserData) : null;
  const navigation = getNavigation(currentUser?.role || null);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/login");
    setIsMobileOpen?.(false);
  };

  const handleNavClick = () => {
    setIsMobileOpen?.(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-slate-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="ml-2 text-lg font-semibold text-white">Vibe LMS</span>
        </div>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{currentUser.username}</p>
              <p className="text-xs text-slate-300 capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                onClick={handleNavClick}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <item.icon className="mr-3 w-4 h-4" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      {currentUser && (
        <div className="border-t border-slate-700 p-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="mr-3 w-4 h-4" />
            Logout
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 sidebar-gradient">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileOpen?.(false)} />
          <div className="relative flex flex-col w-64 sidebar-gradient">
            {/* Mobile Header with Close Button */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="ml-2 text-lg font-semibold text-white">Vibe LMS</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileOpen?.(false)}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile User Info */}
            {currentUser && (
              <div className="px-4 py-3 border-b border-slate-700">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{currentUser.username}</p>
                    <p className="text-xs text-slate-300 capitalize">{currentUser.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      onClick={handleNavClick}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      )}
                    >
                      <item.icon className="mr-3 w-4 h-4" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Logout */}
            {currentUser && (
              <div className="border-t border-slate-700 p-4">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <LogOut className="mr-3 w-4 h-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}