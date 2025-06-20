import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Eye, Trash2 } from "lucide-react";
import type { CourseWithStats } from "@shared/schema";

interface CourseTableProps {
  courses: CourseWithStats[];
  isLoading: boolean;
  onEditCourse?: (courseId: number) => void;
  onViewCourse?: (courseId: number) => void;
  onDeleteCourse?: (courseId: number) => void;
}

export default function CourseTable({ 
  courses, 
  isLoading, 
  onEditCourse, 
  onViewCourse, 
  onDeleteCourse 
}: CourseTableProps) {
  
  if (isLoading) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Loading courses...
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <div className="mb-4">No courses found</div>
        <p className="text-sm">Create your first course to get started</p>
      </div>
    );
  }

  const getCourseIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('javascript') || lowerTitle.includes('js')) return '💻';
    if (lowerTitle.includes('design') || lowerTitle.includes('ui')) return '🎨';
    if (lowerTitle.includes('database') || lowerTitle.includes('sql')) return '🗄️';
    if (lowerTitle.includes('python')) return '🐍';
    if (lowerTitle.includes('react')) return '⚛️';
    return '📚';
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      'gradient-blue',
      'gradient-green', 
      'gradient-purple'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50">
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Course</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Students</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Progress</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Status</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course, index) => (
            <TableRow key={course.id} className="hover:bg-neutral-50">
              <TableCell>
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${getGradientClass(index)} rounded-lg flex items-center justify-center text-white text-lg`}>
                    {getCourseIcon(course.title)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-neutral-900">{course.title}</div>
                    <div className="text-sm text-neutral-500">
                      {course.chaptersCount} Chapters • {course.lessonsCount} Lessons
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-neutral-900">{course.studentsCount}</div>
                <div className="text-sm text-neutral-500">Students enrolled</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${course.averageProgress}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-600">{course.averageProgress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={
                  course.status === 'published' ? 'bg-secondary/10 text-secondary' :
                  course.status === 'draft' ? 'bg-accent/10 text-accent' :
                  'bg-neutral-100 text-neutral-800'
                }>
                  {course.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {onEditCourse && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onEditCourse(course.id)}
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                  )}
                  {onViewCourse && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onViewCourse(course.id)}
                    >
                      <Eye className="w-4 h-4 text-neutral-500" />
                    </Button>
                  )}
                  {onDeleteCourse && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onDeleteCourse(course.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
