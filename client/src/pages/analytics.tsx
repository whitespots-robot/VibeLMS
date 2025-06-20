import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  const [isResetting, setIsResetting] = useState(false);
  const [isReset, setIsReset] = useState(false);
  
  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
    queryFn: async () => {
      if (isReset) {
        // Return all zeros when reset
        return {
          totalCourses: 0,
          totalStudents: 0,
          totalEnrollments: 0,
          averageProgress: 0,
          completionRate: 0,
          popularCourses: [],
          studentActivity: [
            { date: "2024-01-15", activeUsers: 0, newEnrollments: 0 },
            { date: "2024-01-16", activeUsers: 0, newEnrollments: 0 },
            { date: "2024-01-17", activeUsers: 0, newEnrollments: 0 },
            { date: "2024-01-18", activeUsers: 0, newEnrollments: 0 },
            { date: "2024-01-19", activeUsers: 0, newEnrollments: 0 },
            { date: "2024-01-20", activeUsers: 0, newEnrollments: 0 },
            { date: "2024-01-21", activeUsers: 0, newEnrollments: 0 }
          ]
        };
      }
      
      // Generate dynamic data based on current time for demo purposes
      const now = new Date();
      const randomFactor = Math.floor(now.getSeconds() / 10) + 1;
      return {
        totalCourses: randomFactor,
        totalStudents: randomFactor * 2,
        totalEnrollments: randomFactor * 3,
        averageProgress: 65 + (randomFactor * 5),
        completionRate: 80 + randomFactor,
        popularCourses: [
          {
            id: 1,
            title: "🎯 Demo Course - Web Development Basics",
            enrollments: randomFactor * 2,
            avgProgress: 60 + (randomFactor * 8),
            completionRate: 75 + (randomFactor * 3)
          }
        ],
        studentActivity: [
          { date: "2024-01-15", activeUsers: 10 + randomFactor, newEnrollments: 2 + randomFactor },
          { date: "2024-01-16", activeUsers: 12 + randomFactor, newEnrollments: 3 + randomFactor },
          { date: "2024-01-17", activeUsers: 14 + randomFactor, newEnrollments: 1 + randomFactor },
          { date: "2024-01-18", activeUsers: 16 + randomFactor, newEnrollments: 2 + randomFactor },
          { date: "2024-01-19", activeUsers: 18 + randomFactor, newEnrollments: 4 + randomFactor },
          { date: "2024-01-20", activeUsers: 20 + randomFactor, newEnrollments: 2 + randomFactor },
          { date: "2024-01-21", activeUsers: 22 + randomFactor, newEnrollments: 5 + randomFactor }
        ]
      };
    }
  });

  const handleResetAnalytics = async () => {
    setIsResetting(true);
    try {
      await refetch();
      toast({
        title: "Analytics Updated",
        description: "Analytics data has been refreshed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh analytics data.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

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
          <Button 
            onClick={handleResetAnalytics}
            disabled={isResetting}
            variant="outline"
            className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white border-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Updating...' : 'Reset Analytics'}
          </Button>
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

        {/* Student Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Student Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.studentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{activity.date}</p>
                      <p className="text-sm text-slate-600">Daily activity</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-900">{activity.activeUsers}</p>
                      <p className="text-xs text-blue-600">Active Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-900">{activity.newEnrollments}</p>
                      <p className="text-xs text-green-600">New Enrollments</p>
                    </div>
                  </div>
                </div>
              ))}
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