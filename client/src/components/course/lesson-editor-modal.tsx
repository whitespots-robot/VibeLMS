import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { 
  X, Bold, Italic, List, Image, Plus, Trash2, Link, Unlink,
  Play, FileText, Code, Save, Eye
} from "lucide-react";
import type { Lesson, Question, Material, LessonWithDetails } from "@shared/schema";

interface LessonEditorModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionForm {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function LessonEditorModal({ lesson, isOpen, onClose }: LessonEditorModalProps) {
  const [lessonData, setLessonData] = useState({
    title: lesson.title,
    content: lesson.content || "",
    videoUrl: lesson.videoUrl || "",
    codeExample: lesson.codeExample || "",
    codeLanguage: lesson.codeLanguage || "javascript",
    assignment: lesson.assignment || "",
  });

  const [contentTypes, setContentTypes] = useState({
    video: !!lesson.videoUrl,
    text: !!lesson.content,
  });

  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [linkedMaterials, setLinkedMaterials] = useState<Material[]>([]);
  const { toast } = useToast();

  // Fetch lesson details with questions and materials
  const { data: lessonDetails } = useQuery<LessonWithDetails>({
    queryKey: ["/api/lessons", lesson.id],
    enabled: isOpen,
  });

  // Fetch all materials for linking
  const { data: allMaterials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (lessonDetails) {
      setQuestions(lessonDetails.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
      })));
      setLinkedMaterials(lessonDetails.materials);
    }
  }, [lessonDetails]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/lessons/${lesson.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all course-related queries to ensure updates are reflected
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].includes('/api/courses/')
      });
      
      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lesson",
        variant: "destructive",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      const response = await apiRequest("POST", "/api/questions", questionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lesson.id] });
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/questions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lesson.id] });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lesson.id] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
  });

  const linkMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      const response = await apiRequest("POST", `/api/materials/${materialId}/link/${lesson.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lesson.id] });
      toast({
        title: "Success",
        description: "Material linked successfully",
      });
    },
  });

  const unlinkMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      await apiRequest("DELETE", `/api/materials/${materialId}/link/${lesson.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lesson.id] });
      toast({
        title: "Success",
        description: "Material unlinked successfully",
      });
    },
  });

  const handleSave = () => {
    updateLessonMutation.mutate({
      ...lessonData,
      videoUrl: contentTypes.video ? lessonData.videoUrl : null,
      content: contentTypes.text ? lessonData.content : null,
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question: "",
      options: ["", "", ""],
      correctAnswer: 0,
      explanation: "",
    }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    if (field === 'options') {
      updated[index] = { ...updated[index], options: value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setQuestions(updated);
  };

  const saveQuestion = (index: number) => {
    const question = questions[index];
    const questionData = {
      lessonId: lesson.id,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      orderIndex: index,
    };

    if (question.id) {
      updateQuestionMutation.mutate({ id: question.id, data: questionData });
    } else {
      createQuestionMutation.mutate(questionData);
    }
  };

  const deleteQuestion = (index: number) => {
    const question = questions[index];
    if (question.id) {
      deleteQuestionMutation.mutate(question.id);
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveLesson = () => {
    const updateData = {
      title: lessonData.title,
      content: contentTypes.text ? lessonData.content : null,
      videoUrl: contentTypes.video ? lessonData.videoUrl : null,
      assignment: lessonData.assignment || null,
    };
    
    updateLessonMutation.mutate(updateData);
  };

  const embedUrl = lessonData.videoUrl ? getYouTubeEmbedUrl(lessonData.videoUrl) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Lesson: {lesson.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Content Editor */}
          <div className="flex-1 overflow-y-auto pr-4">
            <ScrollArea className="h-full">
              <div className="space-y-6 pb-20">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">Lesson Title</Label>
                    <Input
                      value={lessonData.title}
                      onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  {/* Content Type Selector */}
                  <div>
                    <Label className="text-sm font-medium text-neutral-700 mb-2 block">Content Type</Label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="video"
                          checked={contentTypes.video}
                          onCheckedChange={(checked) => 
                            setContentTypes({ ...contentTypes, video: !!checked })
                          }
                        />
                        <Label htmlFor="video" className="text-sm">Video</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="text"
                          checked={contentTypes.text}
                          onCheckedChange={(checked) => 
                            setContentTypes({ ...contentTypes, text: !!checked })
                          }
                        />
                        <Label htmlFor="text" className="text-sm">Text</Label>
                      </div>

                    </div>
                  </div>
                </div>

                {/* YouTube Video */}
                {contentTypes.video && (
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">YouTube Video URL</Label>
                    <Input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={lessonData.videoUrl}
                      onChange={(e) => setLessonData({ ...lessonData, videoUrl: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Text Content */}
                {contentTypes.text && (
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">Lesson Content</Label>
                    <div className="mt-1">
                      <RichTextEditor
                        content={lessonData.content || ''}
                        onChange={(content) => setLessonData({ ...lessonData, content })}
                        placeholder="Write your lesson content here... Use the toolbar above for formatting options."
                        className="min-h-[300px]"
                      />
                    </div>
                  </div>
                )}

                {/* Questions Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-neutral-700">Assessment Questions</Label>
                    <Button onClick={addQuestion} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-neutral-700">Question {index + 1}</span>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => saveQuestion(index)}
                                disabled={!question.question.trim()}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-md disabled:opacity-50"
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteQuestion(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Input
                            placeholder="Enter your question..."
                            value={question.question}
                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            className="mb-3"
                          />
                          <div className="space-y-2 mb-3">
                            {question.options.map((option, optIndex) => (
                              <Input
                                key={optIndex}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(index, 'options', newOptions);
                                }}
                                className="text-sm"
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-neutral-600 mb-1 block">Correct Answer</Label>
                              <Select
                                value={question.correctAnswer.toString()}
                                onValueChange={(value) => updateQuestion(index, 'correctAnswer', parseInt(value))}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map((_, optIndex) => (
                                    <SelectItem key={optIndex} value={optIndex.toString()}>
                                      Option {String.fromCharCode(65 + optIndex)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-neutral-600 mb-1 block">Explanation (Optional)</Label>
                              <Input
                                placeholder="Explain the correct answer..."
                                value={question.explanation}
                                onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Practice Assignment */}
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Practice Assignment (Optional)</Label>
                  <Textarea
                    rows={4}
                    className="mt-1"
                    placeholder="Describe the practice assignment for students..."
                    value={lessonData.assignment}
                    onChange={(e) => setLessonData({ ...lessonData, assignment: e.target.value })}
                  />
                </div>

                {/* Linked Materials */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-neutral-700">Linked Materials</Label>
                  </div>
                  <div className="space-y-2 mb-4">
                    {linkedMaterials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm text-neutral-800">{material.title}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => unlinkMaterialMutation.mutate(material.id)}
                          className="bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-600 border-red-300"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Select onValueChange={(value) => linkMaterialMutation.mutate(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material to link..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allMaterials
                        .filter(m => !linkedMaterials.some(lm => lm.id === m.id))
                        .map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-neutral-200 bg-neutral-50 p-6 overflow-y-auto">
            <h4 className="text-sm font-semibold text-neutral-700 mb-4">Preview</h4>
            <div className="space-y-4">
              {/* Video Preview */}
              {contentTypes.video && lessonData.videoUrl && (
                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                      title="YouTube video preview"
                    />
                  ) : (
                    <Play className="w-12 h-12 text-white opacity-70" />
                  )}
                </div>
              )}

              {/* Content Preview */}
              {contentTypes.text && lessonData.content && (
                <div className="text-sm text-neutral-700 leading-relaxed rich-text-content">
                  {lessonData.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              )}



              {/* Assignment Preview */}
              {lessonData.assignment && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">Practice Assignment</h5>
                  <p className="text-sm text-blue-800">{lessonData.assignment}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Modal Footer */}
        <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-white shadow-lg z-10">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border-gray-300"
            >
              Cancel
            </Button>
          </div>
          <Button
            onClick={saveLesson}
            disabled={updateLessonMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateLessonMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
