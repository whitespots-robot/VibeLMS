import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, Eye } from "lucide-react";
import type { CourseWithStats } from "@shared/schema";

export default function PublicCourses() {
  const { data: courses = [], isLoading } = useQuery<CourseWithStats[]>({
    queryKey: ["/api/public/courses"],
  });

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Vibe LMS - Public Courses
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Explore our collection of free courses. No registration required to browse.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-600 mb-2">No Public Courses Available</h3>
            <p className="text-neutral-500">Check back later for new courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
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

        <div className="text-center mt-12">
          <div className="inline-flex gap-4">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="btn-primary">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}