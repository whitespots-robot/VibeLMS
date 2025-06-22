import { useState, useEffect } from "react";
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
import LessonPreviewModal from "@/components/course/lesson-preview-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Book, FolderOpen, PlayCircle, FileText, Code, 
  ClipboardList, Plus, ChevronDown, ChevronRight,
  Edit, Eye, Trash2, GripVertical, Settings
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Course, Chapter, Lesson, ChapterWithLessons } from "@shared/schema";

export default function CourseEditor() {
  const [match, params] = useRoute("/courses/:id/edit");
  const courseId = params?.id ? parseInt(params.id) : null;
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [previewingLesson, setPreviewingLesson] = useState<Lesson | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const [courseInfo, setCourseInfo] = useState({
    title: "",
    description: "",
    status: "draft" as "draft" | "published" | "archived",
    isPublic: false,
    allowRegistration: true
  });
  const { toast } = useToast();

  const { data: course, isLoading } = useQuery<Course & { chapters: ChapterWithLessons[] }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Initialize course info when course data loads
  useEffect(() => {
    if (course) {
      setCourseInfo({
        title: course.title,
        description: course.description || "",
        status: course.status as "draft" | "published" | "archived",
        isPublic: course.isPublic || false,
        allowRegistration: course.allowRegistration !== false
      });
    }
  }, [course]);

  const updateCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/courses/${courseId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Updated",
        description: "Course information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const handleSaveCourseInfo = () => {
    updateCourseMutation.mutate(courseInfo);
  };

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
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await apiRequest("DELETE", `/api/lessons/${lessonId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      const response = await apiRequest("DELETE", `/api/chapters/${chapterId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      toast({
        title: "Success",
        description: "Chapter deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive",
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
    
    const chapterOrderIndex = course?.chapters?.length || 0;
    
    createChapterMutation.mutate({
      title: newChapterTitle,
      description: newChapterDescription,
      courseId,
      orderIndex: chapterOrderIndex,
    });
  };

  const handleCreateLesson = (chapterId: number) => {
    const chapter = course?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    // Expand the chapter to show the new lesson
    const newExpanded = new Set(expandedChapters);
    newExpanded.add(chapterId);
    setExpandedChapters(newExpanded);

    createLessonMutation.mutate({
      title: "New Lesson",
      chapterId,
      orderIndex: chapter.lessons.length,
    });
  };

  const handleDeleteLesson = (lessonId: number) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleDeleteChapter = (chapterId: number) => {
    if (window.confirm('Are you sure you want to delete this chapter and all its lessons?')) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  // Mutations for reordering
  const updateLessonOrderMutation = useMutation({
    mutationFn: async ({ lessonId, orderIndex }: { lessonId: number, orderIndex: number }) => {
      const response = await apiRequest("PUT", `/api/lessons/${lessonId}`, { orderIndex });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
    },
  });

  const updateChapterOrderMutation = useMutation({
    mutationFn: async ({ chapterId, orderIndex }: { chapterId: number, orderIndex: number }) => {
      const response = await apiRequest("PUT", `/api/chapters/${chapterId}`, { orderIndex });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Handle lesson reordering
    if (active.id.toString().startsWith('lesson-') && over.id.toString().startsWith('lesson-')) {
      const activeLessonId = parseInt(active.id.toString().replace('lesson-', ''));
      const overLessonId = parseInt(over.id.toString().replace('lesson-', ''));
      
      // Find the chapter containing these lessons
      let targetChapter = null;
      for (const chapter of course?.chapters || []) {
        if (chapter.lessons.some(l => l.id === activeLessonId || l.id === overLessonId)) {
          targetChapter = chapter;
          break;
        }
      }

      if (targetChapter) {
        const lessons = [...targetChapter.lessons];
        const oldIndex = lessons.findIndex(l => l.id === activeLessonId);
        const newIndex = lessons.findIndex(l => l.id === overLessonId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedLessons = arrayMove(lessons, oldIndex, newIndex);
          
          // Update order indices for all affected lessons
          reorderedLessons.forEach((lesson, index) => {
            if (lesson.orderIndex !== index) {
              updateLessonOrderMutation.mutate({ lessonId: lesson.id, orderIndex: index });
            }
          });
        }
      }
    }

    // Handle chapter reordering
    if (active.id.toString().startsWith('chapter-') && over.id.toString().startsWith('chapter-')) {
      const activeChapterId = parseInt(active.id.toString().replace('chapter-', ''));
      const overChapterId = parseInt(over.id.toString().replace('chapter-', ''));
      
      const chapters = [...(course?.chapters || [])];
      const oldIndex = chapters.findIndex(c => c.id === activeChapterId);
      const newIndex = chapters.findIndex(c => c.id === overChapterId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
        
        // Update order indices for all affected chapters
        reorderedChapters.forEach((chapter, index) => {
          if (chapter.orderIndex !== index) {
            updateChapterOrderMutation.mutate({ chapterId: chapter.id, orderIndex: index });
          }
        });
      }
    }
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

  // Sortable Lesson Component
  function SortableLesson({ lesson }: { lesson: Lesson }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: `lesson-${lesson.id}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center p-2 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 mr-2 text-neutral-400" />
        </div>
        {getLessonIcon(lesson)}
        <div className="ml-3 flex-1">
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
              {lesson.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setEditingLesson(lesson)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setPreviewingLesson(lesson)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleDeleteLesson(lesson.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Sortable Chapter Component
  function SortableChapter({ chapter }: { chapter: ChapterWithLessons }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: `chapter-${chapter.id}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isExpanded = expandedChapters.has(chapter.id);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border border-neutral-200 rounded-lg bg-white"
      >
        <div className="flex items-center p-4 hover:bg-neutral-50 transition-colors">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-2">
            <GripVertical className="w-4 h-4 text-neutral-400" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleChapter(chapter.id)}
            className="mr-3"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          <Book className="w-5 h-5 text-primary mr-3" />
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-800">{chapter.title}</h3>
            {chapter.description && (
              <p className="text-sm text-neutral-600 mt-1">{chapter.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-neutral-500">
                {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCreateLesson(chapter.id)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Lesson
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteChapter(chapter.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isExpanded && chapter.lessons.length > 0 && (
          <div className="px-4 pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={chapter.lessons.map(l => `lesson-${l.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 ml-6">
                  {chapter.lessons
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((lesson) => (
                      <SortableLesson key={lesson.id} lesson={lesson} />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    );
  }

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
              <Card className="card-gradient">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Book className="w-5 h-5 mr-2 text-primary" />
                      Course Structure
                    </CardTitle>
                    <Button 
                      onClick={() => setIsChapterDialogOpen(true)}
                      size="sm"
                      className="btn-primary"
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
                          onClick={() => handleCreateLesson(chapter.id)}
                          className="btn-success"
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
                                      {lesson.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
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
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setPreviewingLesson(lesson)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                >
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
                    <Input 
                      value={courseInfo.title} 
                      onChange={(e) => setCourseInfo(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1" 
                      placeholder="Enter course title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Description</label>
                    <Textarea 
                      value={courseInfo.description} 
                      onChange={(e) => setCourseInfo(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1" 
                      rows={3}
                      placeholder="Enter course description..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">Course Status</Label>
                    <Select
                      value={courseInfo.status}
                      onValueChange={(value: "draft" | "published" | "archived") => 
                        setCourseInfo(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            Draft
                          </div>
                        </SelectItem>
                        <SelectItem value="published">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Published
                          </div>
                        </SelectItem>
                        <SelectItem value="archived">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                            Archived
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={courseInfo.isPublic}
                        onChange={(e) => setCourseInfo(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="isPublic" className="text-sm font-medium text-neutral-700">
                        Public Course
                      </label>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">
                      Allow anyone to view this course without registration
                    </p>
                    

                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      onClick={handleSaveCourseInfo}
                      disabled={updateCourseMutation.isPending}
                      className="w-full"
                    >
                      {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
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
                className="btn-primary"
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

      {/* Lesson Preview Modal */}
      {previewingLesson && (
        <LessonPreviewModal
          lesson={previewingLesson}
          isOpen={!!previewingLesson}
          onClose={() => setPreviewingLesson(null)}
        />
      )}
    </>
  );
}
