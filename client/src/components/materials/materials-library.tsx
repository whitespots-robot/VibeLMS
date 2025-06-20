import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, getFileIcon, getFileIconColor } from "@/lib/utils";
import { Download, Link, Trash2, Upload } from "lucide-react";
import type { Material } from "@shared/schema";

interface MaterialsLibraryProps {
  materials: Material[];
  isLoading: boolean;
  onDeleteMaterial?: (materialId: number) => void;
  onLinkMaterial?: (materialId: number) => void;
  showLinkButton?: boolean;
}

export default function MaterialsLibrary({ 
  materials, 
  isLoading, 
  onDeleteMaterial,
  onLinkMaterial,
  showLinkButton = false
}: MaterialsLibraryProps) {

  const handleDownload = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material.id}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = material.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getFileTypeDisplay = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('video')) return 'Video';
    if (fileType.includes('audio')) return 'Audio';
    if (fileType.includes('zip') || fileType.includes('archive')) return 'Archive';
    if (fileType.includes('text') || fileType.includes('code')) return 'Text';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Spreadsheet';
    if (fileType.includes('document') || fileType.includes('word')) return 'Document';
    return 'File';
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800';
    if (fileType.includes('image')) return 'bg-purple-100 text-purple-800';
    if (fileType.includes('video')) return 'bg-blue-100 text-blue-800';
    if (fileType.includes('audio')) return 'bg-green-100 text-green-800';
    if (fileType.includes('zip') || fileType.includes('archive')) return 'bg-yellow-100 text-yellow-800';
    if (fileType.includes('text') || fileType.includes('code')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-neutral-500">Loading materials...</div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center text-neutral-500">
          <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No materials found</h3>
          <p className="text-sm">Upload materials to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50">
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Material</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Type</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Size</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Uploaded</TableHead>
            <TableHead className="font-medium text-neutral-500 uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id} className="hover:bg-neutral-50">
              <TableCell>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    material.fileType.includes('pdf') ? 'bg-red-100' :
                    material.fileType.includes('image') ? 'bg-purple-100' :
                    material.fileType.includes('video') ? 'bg-blue-100' :
                    material.fileType.includes('audio') ? 'bg-green-100' :
                    material.fileType.includes('zip') || material.fileType.includes('archive') ? 'bg-yellow-100' :
                    material.fileType.includes('text') || material.fileType.includes('code') ? 'bg-green-100' :
                    'bg-gray-100'
                  }`}>
                    <i className={`${getFileIcon(material.fileType)} ${getFileIconColor(material.fileType)}`}></i>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-neutral-900">{material.title}</div>
                    <div className="text-sm text-neutral-500">{material.fileName}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getFileTypeColor(material.fileType)}>
                  {getFileTypeDisplay(material.fileType)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-neutral-600">{formatFileSize(material.fileSize)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-neutral-600">
                  {new Date(material.createdAt).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {showLinkButton && onLinkMaterial && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onLinkMaterial(material.id)}
                      className="text-primary hover:text-blue-600"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(material)}
                    className="text-secondary hover:text-emerald-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {onDeleteMaterial && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteMaterial(material.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
