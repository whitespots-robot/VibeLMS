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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Preview: {lesson.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[80vh] space-y-6">
          {/* Content Type Badges */}
          <div className="flex items-center space-x-2">
            {getContentBadges().map((badge, index) => (
              <Badge key={index} className={`text-xs ${badge.color} flex items-center`}>
                <badge.icon className="w-3 h-3 mr-1" />
                {badge.label}
              </Badge>
            ))}
            {getContentBadges().length === 0 && (
              <Badge variant="outline" className="text-xs text-gray-600">
                Empty Lesson
              </Badge>
            )}
          </div>

          {/* Video Content */}
          {embedUrl && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Play className="w-5 h-5 mr-2 text-blue-600" />
                Video Content
              </h3>
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
            </div>
          )}

          {/* Text Content */}
          {lesson.content && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Text Content
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="rich-text-content prose max-w-none">
                  {lesson.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Code Example */}
          {lesson.codeExample && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Code className="w-5 h-5 mr-2 text-orange-600" />
                Code Example
                {lesson.codeLanguage && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {lesson.codeLanguage}
                  </Badge>
                )}
              </h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{lesson.codeExample}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Assignment */}
          {lesson.assignment && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-red-600" />
                Assignment
              </h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="text-gray-700 leading-relaxed">
                  {lesson.assignment.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!lesson.videoUrl && !lesson.content && !lesson.codeExample && !lesson.assignment && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Empty Lesson</h3>
              <p className="text-gray-500">This lesson doesn't have any content yet. Click Edit to add content.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}