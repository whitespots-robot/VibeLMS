import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, Clock, Eye, X, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CourseWithStats } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function PublicCourses() {
  const [, setLocation] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.reload();
  };

  const { data: courses = [], isLoading } = useQuery<CourseWithStats[]>({
    queryKey: ["/api/public/courses", Date.now()],
  });

  const { data: registrationAllowed = true } = useQuery({
    queryKey: ["/api/settings/allow_student_registration", Date.now()],
    select: (data: { value: string | null }) => data.value !== "false",
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setIsLoginOpen(false);
      if (data.user.role === "instructor") {
        setLocation("/dashboard");
      } else {
        setLocation("/learning");
      }
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      if (!registrationAllowed) {
        throw new Error("Student registration is currently disabled");
      }
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setIsRegisterOpen(false);
      setLocation("/learning");
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading public courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with User Info or Login Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">V</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">Vibe LMS</span>
          </div>
          <div className="flex gap-3 items-center">
            {currentUser ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation(currentUser.role === "instructor" ? "/dashboard" : "/learning")}
                >
                  Go to {currentUser.role === "instructor" ? "Dashboard" : "Learning"}
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Welcome, <strong>{currentUser.username}</strong> ({currentUser.role})
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                  Login
                </Button>
                <Button 
                  className="btn-primary" 
                  onClick={() => setIsRegisterOpen(true)}
                  disabled={!registrationAllowed}
                  title={!registrationAllowed ? "Student registration is currently disabled" : undefined}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Explore Public Courses
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
            Browse our collection of free courses. No registration required to view content.
          </p>
          
          {/* Search Input */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-neutral-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-600 mb-2">
              {searchQuery ? "No courses found" : "No Public Courses Available"}
            </h3>
            <p className="text-neutral-500">
              {searchQuery ? "Try adjusting your search terms" : "Check back later for new courses."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-neutral-800 line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      <Eye className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                    {course.description || "No description available"}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.chaptersCount} chapters
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.lessonsCount} lessons
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.studentsCount} students
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/courses/${course.id}/preview`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Link>
                    </Button>
                    {course.allowRegistration && (
                      <Button asChild size="sm" className="flex-1 btn-primary">
                        <Link href="/register">
                          Register to Enroll
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Login Modal */}
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
            </DialogHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full btn-primary" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center text-sm text-neutral-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginOpen(false);
                      setIsRegisterOpen(true);
                    }}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Register Modal */}
        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Create Account</DialogTitle>
            </DialogHeader>
            {!registrationAllowed ? (
              <div className="text-center p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">Registration Disabled</p>
                  <p className="text-red-600 text-sm mt-1">
                    Student registration is currently disabled by the administrator.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRegisterOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full btn-primary" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                  <div className="text-center text-sm text-neutral-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterOpen(false);
                        setIsLoginOpen(true);
                      }}
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}