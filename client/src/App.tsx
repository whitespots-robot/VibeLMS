import { Switch, Route } from "wouter";
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
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:id/edit" component={CourseEditor} />
          <Route path="/learning" component={Learning} />
          <Route path="/learning/:id" component={CourseLearning} />
          <Route path="/materials" component={Materials} />
          <Route path="/students" component={Students} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/export" component={Export} />
          <Route path="/users" component={UserManagement} />
          <Route component={NotFound} />
        </Switch>
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
