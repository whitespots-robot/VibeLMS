import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import CourseTable from "@/components/course/course-table";
import { BookOpen, Users, ClipboardList, FolderOpen } from "lucide-react";

interface DashboardStats {
  totalCourses: number;
  activeStudents: number;
  assignments: number;
  materials: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  return (
    <>
      <Topbar title="Course Management" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary rounded-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Total Courses</p>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {statsLoading ? "..." : stats?.totalCourses || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Active Students</p>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {statsLoading ? "..." : stats?.activeStudents || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-accent rounded-lg">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Assignments</p>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {statsLoading ? "..." : stats?.assignments || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Materials</p>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {statsLoading ? "..." : stats?.materials || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Courses */}
          <Card>
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Courses</h2>
            </div>
            <CourseTable courses={courses || []} isLoading={coursesLoading} />
          </Card>
        </div>
      </main>
    </>
  );
}
