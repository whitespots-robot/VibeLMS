import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, BookOpen, TrendingUp, Clock } from "lucide-react";

interface EnrollmentWithDetails {
  id: number;
  studentId: number;
  courseId: number;
  progress: number;
  enrolledAt: string;
  student: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  course: {
    id: number;
    title: string;
    status: string;
  };
}

export default function Students() {
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats', Date.now()],
  });

  const { data: enrollments } = useQuery({
    queryKey: ['/api/enrollments', Date.now()],
  });

  const { data: courses } = useQuery({
    queryKey: ['/api/courses', Date.now()],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users', Date.now()],
  });

  const enrollmentsArray: EnrollmentWithDetails[] = Array.isArray(enrollments) ? enrollments : [];
  const usersArray = Array.isArray(users) ? users : [];
  const coursesArray = Array.isArray(courses) ? courses : [];

  // Separate registered and anonymous users
  const registeredUsers = usersArray.filter((user: any) => !user.username.startsWith('anonymous') && user.role === 'student');
  const anonymousUsers = usersArray.filter((user: any) => user.username.startsWith('anonymous'));
  const totalRegistered = registeredUsers.length;
  const totalAnonymous = anonymousUsers.length;
  
  // Get enrollments with user details
  const enrollmentsWithUsers = enrollmentsArray.map(enrollment => {
    const user = usersArray.find((u: any) => u.id === enrollment.studentId);
    const course = coursesArray.find((c: any) => c.id === enrollment.courseId);
    return {
      ...enrollment,
      student: user,
      course: course,
    };
  }).filter(e => e.student && e.course);

  const registeredEnrollments = enrollmentsWithUsers.filter(e => !e.student.username.startsWith('anonymous'));
  const anonymousEnrollments = enrollmentsWithUsers.filter(e => e.student.username.startsWith('anonymous'));

  const totalEnrollments = enrollmentsArray.length;
  const completions = enrollmentsArray.filter((enrollment: any) => enrollment.progress === 100).length;
  const avgProgress = enrollmentsArray.length > 0 
    ? Math.round(enrollmentsArray.reduce((sum: number, enrollment: any) => sum + (enrollment.progress || 0), 0) / enrollmentsArray.length)
    : 0;

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
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Registered</p>
                    <p className="text-2xl font-semibold text-neutral-900">{totalRegistered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg">
                    <UserX className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Anonymous</p>
                    <p className="text-2xl font-semibold text-neutral-900">{totalAnonymous}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Avg. Progress</p>
                    <p className="text-2xl font-semibold text-neutral-900">{avgProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Completions</p>
                    <p className="text-2xl font-semibold text-neutral-900">{completions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registered Students */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Registered Students ({totalRegistered})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registeredEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {registeredEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {enrollment.student.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{enrollment.student.username}</h4>
                            <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{enrollment.course.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={enrollment.progress} className="w-24" />
                            <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                          </div>
                        </div>
                        <Badge variant={enrollment.progress === 100 ? "default" : "secondary"}>
                          {enrollment.progress === 100 ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No registered students have enrolled in courses yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anonymous Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserX className="w-5 h-5 mr-2" />
                Anonymous Students ({totalAnonymous})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anonymousEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {anonymousEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full flex items-center justify-center">
                            <UserX className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Anonymous User</h4>
                            <p className="text-sm text-gray-500">Guest learner</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{enrollment.course.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={enrollment.progress} className="w-24" />
                            <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                          </div>
                        </div>
                        <Badge variant={enrollment.progress === 100 ? "default" : "secondary"}>
                          {enrollment.progress === 100 ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No anonymous students have started courses yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}