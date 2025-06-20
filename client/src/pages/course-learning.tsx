import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, BookOpen, Code, CheckCircle2, ChevronRight, 
  ChevronLeft, Clock, Award, FileText, HelpCircle
} from "lucide-react";
import type { Course, ChapterWithLessons, Lesson, LessonWithDetails, Question } from "@shared/schema";

export default function CourseLearning() {
  const [match, params] = useRoute("/learning/:id");
  const courseId = params?.id ? parseInt(params.id) : null;
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: course, isLoading } = useQuery<Course & { chapters: ChapterWithLessons[] }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const { data: currentLesson } = useQuery<LessonWithDetails>({
    queryKey: [`/api/lessons/${currentLessonId}/details`],
    enabled: !!currentLessonId,
  });

  // Auto-select first lesson when course loads
  useEffect(() => {
    if (course?.chapters?.[0]?.lessons?.[0] && !currentLessonId) {
      setCurrentLessonId(course.chapters[0].lessons[0].id);
    }
  }, [course, currentLessonId]);

  const markLessonComplete = useMutation({
    mutationFn: async (lessonId: number) => {
      // Update student progress
      const response = await apiRequest("POST", "/api/progress", {
        studentId: 1, // Demo student ID
        lessonId,
        completed: true,
        completedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (_, lessonId) => {
      setCompletedLessons(prev => new Set([...Array.from(prev), lessonId]));
      toast({
        title: "Lesson Completed!",
        description: "Great job! You've completed this lesson.",
      });
    },
  });

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

  const allLessons = course.chapters.flatMap(chapter => chapter.lessons);
  const currentLessonIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
  const nextLesson = allLessons[currentLessonIndex + 1];
  const prevLesson = allLessons[currentLessonIndex - 1];
  const progressPercentage = (completedLessons.size / allLessons.length) * 100;

  const embedUrl = currentLesson?.videoUrl ? getYouTubeEmbedUrl(currentLesson.videoUrl) : null;

  return (
    <>
      <Topbar title={`Learning: ${course.title}`} />
      <main className="flex h-full overflow-hidden">
        
        {/* Sidebar - Course Navigation */}
        <div className="w-80 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 overflow-y-auto">
          <div className="p-4">
            {/* Course Header */}
            <div className="mb-6">
              <h1 className="text-lg font-bold text-slate-800 mb-2">{course.title}</h1>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {course.chapters.length} Chapters
                </div>
                <div className="flex items-center">
                  <Play className="w-4 h-4 mr-1" />
                  {allLessons.length} Lessons
                </div>
              </div>
            </div>

            {/* Chapter and Lesson List */}
            <div className="space-y-4">
              {course.chapters.map((chapter) => (
                <div key={chapter.id}>
                  <h3 className="font-semibold text-slate-800 mb-2">{chapter.title}</h3>
                  <div className="space-y-1">
                    {chapter.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLessonId(lesson.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentLessonId === lesson.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {completedLessons.has(lesson.id) ? (
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 mr-2 border border-slate-300 rounded-full" />
                            )}
                            <span className="text-sm font-medium">{lesson.title}</span>
                          </div>
                          {lesson.videoUrl && (
                            <Play className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentLessonId && currentLesson ? (
            <div className="p-6 max-w-4xl mx-auto">
              
              {/* Lesson Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-slate-800">{currentLesson.title}</h1>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => prevLesson && setCurrentLessonId(prevLesson.id)}
                      disabled={!prevLesson}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => nextLesson && setCurrentLessonId(nextLesson.id)}
                      disabled={!nextLesson}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Content Type Badges */}
                <div className="flex items-center space-x-2 mb-4">
                  {currentLesson.videoUrl && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Play className="w-3 h-3 mr-1" />
                      Video
                    </Badge>
                  )}
                  {currentLesson.content && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <FileText className="w-3 h-3 mr-1" />
                      Reading
                    </Badge>
                  )}
                  {currentLesson.codeExample && (
                    <Badge className="bg-orange-100 text-orange-800">
                      <Code className="w-3 h-3 mr-1" />
                      Code
                    </Badge>
                  )}
                  {currentLesson.questions?.length > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      <HelpCircle className="w-3 h-3 mr-1" />
                      Quiz
                    </Badge>
                  )}
                  {currentLesson.assignment && (
                    <Badge className="bg-red-100 text-red-800">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Assignment
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lesson Content */}
              <div className="space-y-8">
                
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Debug Info:</h4>
                      <pre className="text-xs text-gray-600">
                        {JSON.stringify({
                          hasVideoUrl: !!currentLesson.videoUrl,
                          hasContent: !!currentLesson.content,
                          hasCodeExample: !!currentLesson.codeExample,
                          hasAssignment: !!currentLesson.assignment,
                          questionsCount: currentLesson.questions?.length || 0,
                          embedUrl: !!embedUrl
                        }, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
                
                {/* Empty lesson warning */}
                {!embedUrl && !currentLesson.content && !currentLesson.codeExample && !currentLesson.assignment && (!currentLesson.questions || currentLesson.questions.length === 0) && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-6 text-center">
                      <FileText className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Empty Lesson</h3>
                      <p className="text-yellow-700">
                        This lesson doesn't have any content yet. Add videos, text, code examples, or assignments in the course editor.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Video Content */}
                {embedUrl && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={embedUrl}
                          title="Lesson Video"
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Text Content */}
                {currentLesson.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-purple-600" />
                        Reading Material
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-lg max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Code Example */}
                {currentLesson.codeExample && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Code className="w-5 h-5 mr-2 text-orange-600" />
                        Code Example
                        {currentLesson.codeLanguage && (
                          <Badge className="ml-2 bg-orange-100 text-orange-800">
                            {currentLesson.codeLanguage}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">
                          <code>{currentLesson.codeExample}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Questions/Quiz */}
                {currentLesson.questions && currentLesson.questions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <HelpCircle className="w-5 h-5 mr-2 text-green-600" />
                        Knowledge Check
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {currentLesson.questions.map((question, index) => (
                          <div key={question.id}>
                            <h4 className="font-semibold text-slate-800 mb-3">
                              Question {index + 1}: {question.question}
                            </h4>
                            <div className="space-y-2">
                              {(question.options as string[]).map((option, optIndex) => (
                                <div 
                                  key={optIndex}
                                  className={`p-3 rounded-lg border transition-colors ${
                                    optIndex === question.correctAnswer 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    {optIndex === question.correctAnswer && (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    )}
                                    <span className="font-medium">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    <span>{option}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                                <p className="text-blue-800">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assignment */}
                {currentLesson.assignment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-red-600" />
                        Practice Assignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                        <div className="text-slate-700 leading-relaxed">
                          {currentLesson.assignment.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-3 last:mb-0">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lesson Completion */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800 mb-1">Lesson Complete?</h3>
                        <p className="text-green-600 text-sm">
                          Mark this lesson as complete to track your progress.
                        </p>
                      </div>
                      <Button
                        onClick={() => markLessonComplete.mutate(currentLesson.id)}
                        disabled={completedLessons.has(currentLesson.id) || markLessonComplete.isPending}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        {completedLessons.has(currentLesson.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          ) : currentLessonId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Loading lesson...</h3>
                <p className="text-slate-500">Please wait while we load the lesson content.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Select a Lesson</h3>
                <p className="text-slate-500">Choose a lesson from the sidebar to start learning.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}