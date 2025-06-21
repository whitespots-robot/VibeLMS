import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
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
  ChevronLeft, Clock, Award, FileText, HelpCircle, Download, Trophy, PartyPopper
} from "lucide-react";
import type { Course, ChapterWithLessons, Lesson, LessonWithDetails, Question } from "@shared/schema";

export default function CourseLearning() {
  const [match, params] = useRoute("/learning/:id");
  const [previewMatch, previewParams] = useRoute("/courses/:id/preview");
  const courseId = params?.id ? parseInt(params.id) : previewParams?.id ? parseInt(previewParams.id) : null;
  const isPreviewMode = !!previewMatch;
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: course, isLoading, error } = useQuery<Course & { chapters: ChapterWithLessons[] }>({
    queryKey: isPreviewMode ? [`/api/public/courses/${courseId}`] : [`/api/courses/${courseId}`],
    enabled: !!courseId,
    retry: false,
  });

  // Redirect to login if course is not public
  useEffect(() => {
    if (isPreviewMode && error && (error as any)?.status === 403) {
      setLocation("/login");
    }
  }, [error, isPreviewMode, setLocation]);

  const { data: currentLesson } = useQuery<LessonWithDetails>({
    queryKey: isPreviewMode ? [`/api/public/lessons/${currentLessonId}/details`] : [`/api/lessons/${currentLessonId}/details`],
    enabled: !!currentLessonId,
  });

  const { data: registrationAllowed = true } = useQuery({
    queryKey: ["/api/settings/allow_student_registration"],
    select: (data: { value: string | null }) => data.value !== "false",
    enabled: isPreviewMode,
  });

  // Auto-select first lesson when course loads
  useEffect(() => {
    if (course?.chapters?.[0]?.lessons?.[0] && !currentLessonId) {
      setCurrentLessonId(course.chapters[0].lessons[0].id);
    }
  }, [course, currentLessonId]);

  // Reset quiz state when lesson changes
  useEffect(() => {
    if (currentLessonId) {
      setQuestionAnswers({});
      setShowResults({});
    }
  }, [currentLessonId]);

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
      const newCompletedLessons = new Set([...Array.from(completedLessons), lessonId]);
      setCompletedLessons(newCompletedLessons);
      
      // Check if course is now complete
      if (course) {
        const allLessons = course.chapters.flatMap(chapter => chapter.lessons);
        const isComplete = newCompletedLessons.size === allLessons.length;
        
        if (isComplete) {
          // Show confetti animation
          setShowConfetti(true);
          setShowCongratulations(true);
          
          // Remove confetti after 3 seconds
          setTimeout(() => {
            setShowConfetti(false);
            // Redirect to learning page after congratulations
            setTimeout(() => {
              setLocation("/learning");
            }, 2000);
          }, 3000);
        } else {
          // Find the next lesson and navigate to it
          const allLessons = course.chapters.flatMap(chapter => chapter.lessons);
          const currentIndex = allLessons.findIndex(lesson => lesson.id === lessonId);
          const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 
            ? allLessons[currentIndex + 1] 
            : null;

          if (nextLesson) {
            toast({
              title: "Lesson Completed!",
              description: "Moving to next lesson...",
            });
            // Navigate to the next lesson after a short delay
            setTimeout(() => {
              setCurrentLessonId(nextLesson.id);
              // Scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 1000);
          } else {
            toast({
              title: "Lesson Completed!",
              description: "Great job! You've completed this lesson.",
            });
          }
        }
      }
    },
  });

  if ((!match && !previewMatch) || !courseId) {
    return <div>Course not found</div>;
  }

  if (isLoading) {
    return (
      <>
        {isPreviewMode ? (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">V</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Loading...</h1>
            </div>
          </div>
        ) : (
          <Topbar title="Loading..." />
        )}
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
        {isPreviewMode ? (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg font-bold">V</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Course Not Found</h1>
              </div>
              <Button variant="outline" onClick={() => setLocation("/")}>
                Back to Courses
              </Button>
            </div>
          </div>
        ) : (
          <Topbar title="Course Not Found" />
        )}
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
      {isPreviewMode ? (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Course Preview: {course.title}</h1>
                <p className="text-sm text-gray-600">Public preview mode - Register to access full course</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setLocation("/")}>
                Back to Courses
              </Button>
              <Button 
                className="btn-primary" 
                onClick={() => setLocation("/")}
                disabled={!registrationAllowed}
                title={!registrationAllowed ? "Student registration is currently disabled" : undefined}
              >
                Register to Enroll
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Topbar title={`Learning: ${course.title}`} />
      )}
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
                        Knowledge Check ({currentLesson.questions.length} questions)
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
                              {(question.options as string[])
                                .filter((option, index) => option && option.trim() !== '')
                                .map((option, optIndex) => {
                                  const originalIndex = (question.options as string[]).indexOf(option);
                                  const isSelected = questionAnswers[question.id] === originalIndex;
                                  const isShowingResults = showResults[question.id];
                                  const isCorrect = originalIndex === question.correctAnswer;
                                  
                                  let bgClass = 'bg-slate-50 border-slate-200 hover:bg-slate-100';
                                  if (isShowingResults) {
                                    if (isCorrect) {
                                      bgClass = 'bg-green-50 border-green-200';
                                    } else if (isSelected && !isCorrect) {
                                      bgClass = 'bg-red-50 border-red-200';
                                    }
                                  } else if (isSelected) {
                                    bgClass = 'bg-blue-50 border-blue-200';
                                  }
                                  
                                  return (
                                    <button 
                                      key={optIndex}
                                      disabled={isShowingResults}
                                      onClick={() => {
                                        if (!isShowingResults) {
                                          setQuestionAnswers(prev => ({
                                            ...prev,
                                            [question.id]: originalIndex
                                          }));
                                        }
                                      }}
                                      className={`w-full p-3 rounded-lg border transition-colors text-left ${bgClass} ${
                                        !isShowingResults ? 'cursor-pointer' : 'cursor-default'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        {isShowingResults && isCorrect && (
                                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        )}
                                        {isShowingResults && isSelected && !isCorrect && (
                                          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                            <span className="text-white text-xs">✕</span>
                                          </div>
                                        )}
                                        <span className="font-medium">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        <span>{option}</span>
                                        {!isShowingResults && isSelected && (
                                          <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })
                              }
                              
                              {/* Submit Answer Button */}
                              {questionAnswers[question.id] !== undefined && !showResults[question.id] && (
                                <Button 
                                  onClick={() => {
                                    setShowResults(prev => ({
                                      ...prev,
                                      [question.id]: true
                                    }));
                                  }}
                                  className="mt-3"
                                  size="sm"
                                >
                                  Submit Answer
                                </Button>
                              )}
                              
                              {(question.options as string[]).filter(option => option && option.trim() !== '').length === 0 && (
                                <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                                  <p className="text-sm text-yellow-700">No answer options provided for this question.</p>
                                </div>
                              )}
                            </div>
                            {question.explanation && showResults[question.id] && (
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

                {/* Materials */}
                {currentLesson.materials && currentLesson.materials.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-purple-600" />
                        Downloadable Materials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentLesson.materials.map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">{material.title}</h4>
                                <p className="text-sm text-slate-600">{material.fileName}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/materials/${material.id}/download`;
                                link.download = material.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              variant="outline"
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
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

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Top-left confetti */}
          <div className="absolute top-4 left-4 animate-bounce">
            {[...Array(15)].map((_, i) => (
              <div
                key={`tl-${i}`}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}px`,
                  top: `${Math.random() * 100}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
          
          {/* Top-right confetti */}
          <div className="absolute top-4 right-4 animate-bounce">
            {[...Array(15)].map((_, i) => (
              <div
                key={`tr-${i}`}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}px`,
                  top: `${Math.random() * 100}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
          
          {/* Bottom-left confetti */}
          <div className="absolute bottom-4 left-4 animate-bounce">
            {[...Array(15)].map((_, i) => (
              <div
                key={`bl-${i}`}
                className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}px`,
                  top: `${Math.random() * 100}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
          
          {/* Bottom-right confetti */}
          <div className="absolute bottom-4 right-4 animate-bounce">
            {[...Array(15)].map((_, i) => (
              <div
                key={`br-${i}`}
                className="absolute w-2 h-2 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}px`,
                  top: `${Math.random() * 100}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongratulations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <Card className="max-w-md mx-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                <div className="flex items-center justify-center mb-4">
                  <PartyPopper className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-lg font-semibold text-purple-700">Course Complete!</span>
                  <PartyPopper className="w-5 h-5 text-purple-500 ml-2" />
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-gray-700">
                  You have successfully completed <strong>"{course?.title}"</strong>!
                </p>
                <p className="text-gray-600 text-sm">
                  Great work! You can now apply your knowledge in practice.
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-purple-600 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">100% Complete</span>
              </div>
              
              <Button
                onClick={() => {
                  setShowCongratulations(false);
                  setLocation("/learning");
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
              >
                Go to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}