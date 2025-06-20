import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, TrendingUp, Clock } from "lucide-react";

export default function Students() {
  return (
    <>
      <Topbar title="Students" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Total Students</p>
                    <p className="text-2xl font-semibold text-neutral-900">248</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-secondary rounded-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Active Enrollments</p>
                    <p className="text-2xl font-semibold text-neutral-900">186</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-accent rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Avg. Progress</p>
                    <p className="text-2xl font-semibold text-neutral-900">68%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Completions</p>
                    <p className="text-2xl font-semibold text-neutral-900">42</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Management Content */}
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-neutral-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Student Management Coming Soon</h3>
                <p>This section will include student enrollment, progress tracking, and performance analytics.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
