import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { X, Play, FileText, Code, BookOpen, Eye } from "lucide-react";
import type { Lesson } from "@shared/schema";

interface LessonPreviewModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonPreviewModal({ lesson, isOpen, onClose }: LessonPreviewModalProps) {
  if (!lesson) return null;

  const embedUrl = lesson.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;

  const getContentBadges = () => {
    const badges = [];
    if (lesson.videoUrl) badges.push({ label: "Video", color: "bg-blue-100 text-blue-800", icon: Play });
    if (lesson.content) badges.push({ label: "Text", color: "bg-purple-100 text-purple-800", icon: FileText });
    if (lesson.codeExample) badges.push({ label: "Code", color: "bg-orange-100 text-orange-800", icon: Code });
    if (lesson.assignment) badges.push({ label: "Assignment", color: "bg-red-100 text-red-800", icon: BookOpen });
    return badges;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <DialogHeader className="border-b border-slate-200/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-800 mb-2">
                {lesson.title}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                {getContentBadges().map((badge, index) => (
                  <Badge key={index} className={`${badge.color} border-0 shadow-sm flex items-center`}>
                    <badge.icon className="w-3 h-3 mr-1" />
                    {badge.label}
                  </Badge>
                ))}
                {getContentBadges().length === 0 && (
                  <Badge className="bg-gray-100 text-gray-600 border-0">
                    Empty Lesson
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-slate-100">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[80vh] py-6 space-y-8">
          {!lesson.videoUrl && !lesson.content && !lesson.codeExample && !lesson.assignment && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-3">Empty Lesson</h3>
              <p className="text-slate-500 max-w-md">This lesson doesn't have any content yet. Click Edit to add videos, text, code examples, or assignments.</p>
            </div>
          )}

          {/* Video Content */}
          {embedUrl && (
            <div className="space-y-4">
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-200">
                <iframe
                  src={embedUrl}
                  title="Lesson Video"
                  className="w-full h-full rounded-xl"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Text Content */}
          {lesson.content && (
            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/60">
                <div className="prose prose-lg max-w-none text-slate-700">
                  {lesson.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0 leading-relaxed text-slate-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Code Example */}
          {lesson.codeExample && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-slate-800">Code Example</span>
                </div>
                {lesson.codeLanguage && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                    {lesson.codeLanguage}
                  </Badge>
                )}
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl overflow-x-auto shadow-xl border border-slate-700">
                <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
                  <code>{lesson.codeExample}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Assignment */}
          {lesson.assignment && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-slate-800">Assignment</span>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-8 rounded-xl shadow-lg">
                <div className="text-slate-700 leading-relaxed">
                  {lesson.assignment.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}