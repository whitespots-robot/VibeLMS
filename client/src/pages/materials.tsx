import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import MaterialsLibrary from "@/components/materials/materials-library";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Search } from "lucide-react";
import type { Material } from "@shared/schema";

export default function Materials() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const { toast } = useToast();

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials", Date.now()],
  });

  const uploadMaterialMutation = useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      
      const response = await fetch('/api/materials', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials", Date.now()] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setMaterialTitle("");
      toast({
        title: "Success",
        description: "Material uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload material",
        variant: "destructive",
      });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      await apiRequest("DELETE", `/api/materials/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials", Date.now()] });
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) return;
    
    uploadMaterialMutation.mutate({
      file: selectedFile,
      title: materialTitle || selectedFile.name,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!materialTitle) {
        setMaterialTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Topbar 
        title="Materials Library" 
        showCreateButton 
        createButtonText="Upload Material"
        onCreateClick={() => setIsUploadDialogOpen(true)}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            {/* Search */}
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">All Materials</h2>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-64"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
              </div>
            </div>

            <MaterialsLibrary 
              materials={filteredMaterials}
              isLoading={isLoading}
              onDeleteMaterial={(materialId) => deleteMaterialMutation.mutate(materialId)}
            />
          </Card>
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload New Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Material Title</label>
              <Input 
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="Enter material title..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">File</label>
              <div className="mt-1">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept="*/*"
                  className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-blue-600"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 p-2 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-700">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || uploadMaterialMutation.isPending}
              >
                {uploadMaterialMutation.isPending ? "Uploading..." : "Upload Material"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
