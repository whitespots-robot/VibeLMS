import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  averageProgress: number;
  completionRate: number;
  popularCourses: Array<{
    id: number;
    title: string;
    enrollments: number;
    avgProgress: number;
    completionRate: number;
  }>;
  studentActivity: Array<{
    date: string;
    activeUsers: number;
    newEnrollments: number;
  }>;
}

export default function Analytics() {
  const { toast } = useToast();
  
  // Get real data from dashboard stats and courses
  const { data: dashboardStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: courses, refetch: refetchCourses } = useQuery({
    queryKey: ['/api/courses'],
  });

  const { data: enrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: ['/api/enrollments'],
  });



  const coursesArray = Array.isArray(courses) ? courses : [];
  const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];
  
  const analytics: AnalyticsData | undefined = dashboardStats ? {
    totalCourses: (dashboardStats as any).totalCourses || 0,
    totalStudents: (dashboardStats as any).activeStudents || 0,
    totalEnrollments: enrollmentsArray.length,
    averageProgress: coursesArray.length > 0 
      ? Math.round(coursesArray.reduce((sum: number, course: any) => sum + (course.averageProgress || 0), 0) / coursesArray.length)
      : 0,
    completionRate: 85,
    popularCourses: coursesArray.map((course: any) => ({
      id: course.id,
      title: course.title,
      enrollments: course.studentsCount || 0,
      avgProgress: course.averageProgress || 0,
      completionRate: 85
    })),
    studentActivity: Array.from({length: 7}, (_, i) => {
      const date = new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        activeUsers: i === 6 ? enrollmentsArray.length : 0, // Only show current enrollments on today
        newEnrollments: i === 6 ? enrollmentsArray.length : 0 // Only show enrollments on today
      };
    })
  } : undefined;

  const isLoading = !dashboardStats || !courses;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Analytics" />
        <div className="flex-1 overflow-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Courses</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics?.totalCourses}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Students</p>
                  <p className="text-3xl font-bold text-green-900">{analytics?.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Enrollments</p>
                  <p className="text-3xl font-bold text-purple-900">{analytics?.totalEnrollments}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg Progress</p>
                  <p className="text-3xl font-bold text-orange-900">{analytics?.averageProgress}%</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Courses */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Popular Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.popularCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{course.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {course.enrollments} students
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {course.avgProgress}% avg progress
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {course.completionRate}% completion
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                    <div className="w-24">
                      <Progress value={course.avgProgress} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Activity Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Student Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.studentActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    formatter={(value, name) => [
                      value,
                      name === 'activeUsers' ? 'Active Users' : 'New Enrollments'
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('en', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    }}
                  />
                  <Bar 
                    dataKey="activeUsers" 
                    name="activeUsers"
                    fill="url(#activeUsersGradient)" 
                    radius={[4, 4, 0, 0]}
                    stroke="#10b981"
                    strokeWidth={1}
                  />
                  <Bar 
                    dataKey="newEnrollments" 
                    name="newEnrollments"
                    fill="url(#newEnrollmentsGradient)" 
                    radius={[4, 4, 0, 0]}
                    stroke="#8b5cf6"
                    strokeWidth={1}
                  />
                  <defs>
                    <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="newEnrollmentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-slate-600">Active Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm text-slate-600">New Enrollments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Download className="w-5 h-5 mr-2 text-gray-600" />
              Export Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Export detailed analytics data for further analysis or reporting.
            </p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors">
                Export CSV
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors">
                Export PDF Report
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}