
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Share2, Calendar, HardDrive, Eye } from 'lucide-react';
import { FileItem, S3Credentials } from '@/types/s3Types';
import { S3Service } from '@/services/S3Service';

interface FilePreviewProps {
  file: FileItem;
  credentials: S3Credentials | null;
  onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, credentials, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      if (!credentials || file.type === 'folder') return;

      const mimeType = file.mimeType || '';
      
      // Only generate preview URLs for supported file types
      if (mimeType.startsWith('image/') || 
          mimeType.startsWith('video/') || 
          mimeType.startsWith('audio/') ||
          mimeType === 'application/pdf' ||
          mimeType.startsWith('text/')) {
        
        setLoading(true);
        try {
          const s3Service = new S3Service(credentials);
          const url = await s3Service.getFileUrl(file.key);
          setPreviewUrl(url);
        } catch (error) {
          console.error('Failed to generate preview URL:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPreview();
  }, [file, credentials]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Preview not available</p>
          </div>
        </div>
      );
    }

    const mimeType = file.mimeType || '';

    if (mimeType.startsWith('image/')) {
      return (
        <div className="relative">
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            onError={() => setPreviewUrl('')}
          />
        </div>
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <video
          src={previewUrl}
          controls
          className="w-full h-auto max-h-96 rounded-lg"
          onError={() => setPreviewUrl('')}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <audio
            src={previewUrl}
            controls
            className="w-full"
            onError={() => setPreviewUrl('')}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-96 rounded-lg"
          title={file.name}
          onError={() => setPreviewUrl('')}
        />
      );
    }

    if (mimeType.startsWith('text/') || 
        ['application/json', 'application/xml'].includes(mimeType)) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
          <iframe
            src={previewUrl}
            className="w-full h-full border-none"
            title={file.name}
            onError={() => setPreviewUrl('')}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Preview not supported for this file type</p>
        </div>
      </div>
    );
  };

  const getFileTypeCategory = () => {
    const mimeType = file.mimeType || '';
    const extension = file.extension?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'Document';
    if (['js', 'ts', 'html', 'css', 'json', 'xml', 'txt', 'md'].includes(extension)) return 'Code';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'Archive';
    
    return 'File';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{file.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{getFileTypeCategory()}</Badge>
          {file.extension && (
            <Badge variant="secondary">{file.extension.toUpperCase()}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Preview */}
        <div className="flex-1">
          {renderPreview()}
        </div>

        {/* File Details */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Size:</span>
            <span className="text-sm font-medium">{formatFileSize(file.size)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Modified:</span>
            <span className="text-sm font-medium">{formatDate(file.lastModified)}</span>
          </div>

          {file.mimeType && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium font-mono">{file.mimeType}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
