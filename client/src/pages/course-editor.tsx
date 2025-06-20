import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LessonEditorModal from "@/components/course/lesson-editor-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Book, FolderOpen, PlayCircle, FileText, Code, 
  ClipboardList, Plus, ChevronDown, ChevronRight,
  Edit, Eye, Trash2, GripVertical
} from "lucide-react";
import type { Course, Chapter, Lesson, ChapterWithLessons } from "@shared/schema";

export default function CourseEditor() {
  const [match, params] = useRoute("/courses/:id/edit");
  const courseId = params?.id ? parseInt(params.id) : null;
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const { toast } = useToast();

  const { data: course, isLoading } = useQuery<Course & { chapters: ChapterWithLessons[] }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const createChapterMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating chapter with data:", data);
      const response = await apiRequest("POST", "/api/chapters", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      setIsChapterDialogOpen(false);
      setNewChapterTitle("");
      setNewChapterDescription("");
      toast({
        title: "Success",
        description: "Chapter created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Chapter creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create chapter: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/lessons", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
    },
  });

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleCreateChapter = () => {
    if (!courseId || !newChapterTitle.trim()) return;
    
    createChapterMutation.mutate({
      title: newChapterTitle,
      description: newChapterDescription,
      courseId,
      orderIndex: course?.chapters?.length || 0,
    });
  };

  const handleCreateLesson = (chapterId: number) => {
    const chapter = course?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    createLessonMutation.mutate({
      title: "New Lesson",
      chapterId,
      orderIndex: chapter.lessons.length,
    });
  };

  const getContentTypeBadges = (lesson: Lesson) => {
    const badges = [];
    if (lesson.videoUrl) badges.push({ label: "Video", color: "bg-blue-100 text-blue-800" });
    if (lesson.content) badges.push({ label: "Text", color: "bg-purple-100 text-purple-800" });
    if (lesson.codeExample) badges.push({ label: "Code", color: "bg-orange-100 text-orange-800" });
    if (lesson.assignment) badges.push({ label: "Assignment", color: "bg-red-100 text-red-800" });
    return badges;
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.videoUrl) return <PlayCircle className="w-4 h-4 text-secondary" />;
    if (lesson.assignment) return <ClipboardList className="w-4 h-4 text-accent" />;
    if (lesson.codeExample) return <Code className="w-4 h-4 text-orange-500" />;
    return <FileText className="w-4 h-4 text-neutral-500" />;
  };

  if (!match || !courseId) {
    return <div>Course not found</div>;
  }

  if (isLoading) {
    return (
      <>
        <Topbar title="Loading..." />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center">Loading course...</div>
          </div>
        </main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Topbar title="Course Not Found" />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center">Course not found</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title={`Edit: ${course.title}`} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Course Structure Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Book className="w-5 h-5 mr-2 text-primary" />
                      Course Structure
                    </CardTitle>
                    <Button 
                      onClick={() => setIsChapterDialogOpen(true)}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Chapter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.chapters?.map((chapter) => (
                    <div key={chapter.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-4 bg-neutral-50">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleChapter(chapter.id)}
                            className="mr-2"
                          >
                            {expandedChapters.has(chapter.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </button>
                          <FolderOpen className="w-4 h-4 mr-2 text-accent" />
                          <div>
                            <h3 className="font-medium text-neutral-800">{chapter.title}</h3>
                            <p className="text-sm text-neutral-600">{chapter.lessons.length} lessons</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCreateLesson(chapter.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Lesson
                        </Button>
                      </div>
                      
                      {expandedChapters.has(chapter.id) && (
                        <div className="p-4 space-y-2 border-t">
                          {chapter.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div className="flex items-center">
                                <GripVertical className="w-4 h-4 mr-2 text-neutral-400" />
                                {getLessonIcon(lesson)}
                                <div className="ml-3">
                                  <span className="text-sm font-medium text-neutral-700">{lesson.title}</span>
                                  <div className="flex items-center space-x-1 mt-1">
                                    {getContentTypeBadges(lesson).map((badge, index) => (
                                      <Badge key={index} className={`text-xs ${badge.color}`}>
                                        {badge.label}
                                      </Badge>
                                    ))}
                                    {(!lesson.content && !lesson.videoUrl && !lesson.codeExample) && (
                                      <Badge variant="outline" className="text-xs text-orange-600 bg-orange-50">
                                        Empty - Click Edit to add content
                                      </Badge>
                                    )}
                                  </div>
                                  {lesson.content && (
                                    <p className="text-xs text-neutral-500 mt-1 truncate max-w-md">
                                      {lesson.content.substring(0, 100)}...
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setEditingLesson(lesson)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!course.chapters || course.chapters.length === 0) && (
                    <div className="text-center py-8 text-neutral-500">
                      <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No chapters yet. Create your first chapter to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Course Info & Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Title</label>
                    <Input value={course.title} readOnly className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Description</label>
                    <Textarea value={course.description || ""} readOnly className="mt-1" rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Status</label>
                    <div className="mt-1">
                      <Badge className={
                        course.status === 'published' ? 'bg-secondary/10 text-secondary' :
                        course.status === 'draft' ? 'bg-accent/10 text-accent' :
                        'bg-neutral-100 text-neutral-800'
                      }>
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Chapters</span>
                    <span className="font-medium">{course.chapters?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Lessons</span>
                    <span className="font-medium">
                      {course.chapters?.reduce((count, chapter) => count + chapter.lessons.length, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">With Video</span>
                    <span className="font-medium">
                      {course.chapters?.reduce((count, chapter) => 
                        count + chapter.lessons.filter(l => l.videoUrl).length, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">With Assignments</span>
                    <span className="font-medium">
                      {course.chapters?.reduce((count, chapter) => 
                        count + chapter.lessons.filter(l => l.assignment).length, 0) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Create Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Chapter Title</label>
              <Input 
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Enter chapter title..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Description (Optional)</label>
              <Textarea 
                value={newChapterDescription}
                onChange={(e) => setNewChapterDescription(e.target.value)}
                placeholder="Describe this chapter..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsChapterDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateChapter}
                disabled={!newChapterTitle.trim() || createChapterMutation.isPending}
              >
                {createChapterMutation.isPending ? "Creating..." : "Create Chapter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Editor Modal */}
      {editingLesson && (
        <LessonEditorModal 
          lesson={editingLesson}
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}
    </>
  );
}
