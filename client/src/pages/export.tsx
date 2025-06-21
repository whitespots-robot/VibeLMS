import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Package, FileText, FolderOpen } from "lucide-react";
import type { CourseWithStats } from "@shared/schema";

export default function Export() {
  const [exportingCourses, setExportingCourses] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: courses = [], isLoading } = useQuery<CourseWithStats[]>({
    queryKey: ["/api/courses", Date.now()],
  });

  const handleExportCourse = async (courseId: number, courseTitle: string) => {
    setExportingCourses(prev => new Set([...prev, courseId]));
    
    try {
      const response = await fetch(`/api/courses/${courseId}/export`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `${courseTitle} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export course",
        variant: "destructive",
      });
    } finally {
      setExportingCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  return (
    <>
      <Topbar title="Export Courses" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Export Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Export Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Markdown Format</h3>
                    <p className="text-sm text-blue-700">Lessons exported as structured Markdown files</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <FolderOpen className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">Organized Structure</h3>
                    <p className="text-sm text-green-700">Maintains course hierarchy and organization</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                  <Download className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-purple-900">Includes Materials</h3>
                    <p className="text-sm text-purple-700">All linked materials bundled together</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Export List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No courses available for export</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                      <div className="flex items-center">
                        <div className="w-12 h-12 gradient-blue rounded-lg flex items-center justify-center mr-4">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-900">{course.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-neutral-600">
                              {course.chaptersCount} chapters • {course.lessonsCount} lessons
                            </span>
                            <Badge className={
                              course.status === 'published' ? 'bg-secondary/10 text-secondary' :
                              course.status === 'draft' ? 'bg-accent/10 text-accent' :
                              'bg-neutral-100 text-neutral-800'
                            }>
                              {course.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleExportCourse(course.id, course.title)}
                        disabled={exportingCourses.has(course.id)}
                        className="bg-primary text-white hover:bg-blue-600"
                      >
                        {exportingCourses.has(course.id) ? (
                          <>Exporting...</>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Export ZIP
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
