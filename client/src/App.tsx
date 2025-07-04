import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseEditor from "@/pages/course-editor";
import Learning from "@/pages/learning";
import CourseLearning from "@/pages/course-learning";
import Materials from "@/pages/materials";
import Students from "@/pages/students";
import Export from "@/pages/export";
import Analytics from "@/pages/analytics";
import Login from "@/pages/login";
import Register from "@/pages/register";
import UserManagement from "@/pages/user-management";
import PublicCourses from "@/pages/public-courses";
import Sidebar from "@/components/layout/sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

function Router() {
  const [location] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Public routes - no authentication needed
  if (location === "/" || location === "/login" || location === "/register" || location === "/public" || (location.startsWith("/courses/") && location.includes("/preview"))) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/public" component={PublicCourses} />
        <Route path="/" component={PublicCourses} />
        <Route path="/courses/:id/preview" component={CourseLearning} />
      </Switch>
    );
  }

  // Protected routes - require authentication
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Vibe LMS</span>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/courses" component={Courses} />
            <Route path="/courses/:id/edit" component={CourseEditor} />
            <Route path="/learning" component={Learning} />
            <Route path="/courses/:id/learn" component={CourseLearning} />
            <Route path="/materials" component={Materials} />
            <Route path="/students" component={Students} />
            <Route path="/export" component={Export} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/users" component={UserManagement} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
