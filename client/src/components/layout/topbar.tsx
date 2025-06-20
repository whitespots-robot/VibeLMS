import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TopbarProps {
  title: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export default function Topbar({ 
  title, 
  showCreateButton = false, 
  onCreateClick,
  createButtonText = "Create"
}: TopbarProps) {
  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {showCreateButton && (
            <Button 
              onClick={onCreateClick}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createButtonText}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
