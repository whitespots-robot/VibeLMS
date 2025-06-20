import { Button } from "@/components/ui/button";
import { Bell, Menu, Plus } from "lucide-react";

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
          <button className="lg:hidden mr-4 text-neutral-500 hover:text-neutral-700">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {showCreateButton && (
            <Button 
              onClick={onCreateClick}
              className="bg-primary text-white hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createButtonText}
            </Button>
          )}
          <div className="relative">
            <button className="p-2 text-neutral-400 hover:text-neutral-600">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
