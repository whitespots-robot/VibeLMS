import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, Play, Users, Clock, Award, 
  ChevronRight, GraduationCap, Star
} from "lucide-react";
import type { CourseWithStats, Enrollment } from "@shared/schema";

export default function Learning() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch published courses available for learning
  const { data: courses = [], isLoading } = useQuery<CourseWithStats[]>({
    queryKey: ["/api/courses", "published"],
  });

  // Fetch user's enrollments
  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest("POST", "/api/enrollments", {
        courseId,
        progress: 0,
      });
      return response.json();
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      // Immediately navigate to learning interface
      navigate(`/learning/${courseId}`);
    },
  });

  const publishedCourses = courses.filter(course => course.status === 'published');
  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

  const handleStartLearning = (courseId: number) => {
    const isEnrolled = enrolledCourseIds.has(courseId);
    
    if (isEnrolled) {
      // Go directly to learning
      navigate(`/learning/${courseId}`);
    } else {
      // Auto-enroll and then navigate
      enrollMutation.mutate(courseId);
    }
  };

  return (
    <>
      <Topbar title="Start Learning" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold mb-4">
                Welcome to Vibe Learning
              </h1>
              <p className="text-blue-100 text-lg mb-6">
                Discover amazing courses, track your progress, and master new skills at your own pace.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>{publishedCourses.length} Courses Available</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{enrollments.length} Enrolled</span>
                </div>
              </div>
            </div>
          </div>

          {/* My Learning Progress */}
          {enrollments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Continue Learning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const course = courses.find(c => c.id === enrollment.courseId);
                  if (!course) return null;
                  
                  return (
                    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800">In Progress</Badge>
                          <div className="text-sm text-slate-500">
                            {Math.round(enrollment.progress || 0)}% Complete
                          </div>
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={enrollment.progress || 0} className="mb-4" />
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                          <span>{course.chaptersCount} Chapters</span>
                          <span>{course.lessonsCount} Lessons</span>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                          Continue Learning
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Courses */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Available Courses</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-slate-200 rounded mb-4"></div>
                      <div className="h-8 bg-slate-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : publishedCourses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <GraduationCap className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No Courses Available</h3>
                  <p className="text-slate-500">
                    There are no published courses available for learning at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  
                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                          <div className="flex items-center text-sm text-slate-500">
                            <Users className="w-4 h-4 mr-1" />
                            {course.studentsCount}
                          </div>
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            {course.chaptersCount} Chapters
                          </div>
                          <div className="flex items-center">
                            <Play className="w-4 h-4 mr-1" />
                            {course.lessonsCount} Lessons
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleStartLearning(course.id)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          disabled={enrollMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {enrollMutation.isPending ? "Starting..." : isEnrolled ? "Continue Learning" : "Start Learning"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>


    </>
  );
}