import React, { useState, useRef, useMemo } from "react";
import JSZip from "jszip";
import {
  Upload,
  FolderPlus,
  Download,
  Trash2,
  Edit3,
  Share2,
  MoreVertical,
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Code,
  Archive,
  ChevronRight,
  Home,
  RefreshCw,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileItem, FileType, SortBy, SortOrder } from "@/types/s3Types";
import { useToast } from "@/hooks/use-toast";

interface FileBrowserProps {
  files: FileItem[];
  currentPath: string;
  selectedFile: FileItem | null;
  selectedFiles: FileItem[];
  loading: boolean;
  searchTerm: string;
  filterType: FileType;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onFileSelect: (file: FileItem) => void;
  onMultiSelect: (files: FileItem[]) => void;
  onNavigate: (path: string) => void;
  onUpload: (files: File[], path: string) => Promise<void>;
  onDelete: (files: FileItem[]) => Promise<void>;
  onRename: (file: FileItem, newName: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<void>;
  onDownload: (file: FileItem) => Promise<void>;
  onDownloadFolder: (folder: FileItem) => Promise<void>;
  onShare: (file: FileItem, expiresIn: number) => Promise<string>;
  onGetFileUrl?: (file: FileItem) => Promise<string>;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  files,
  currentPath,
  selectedFile,
  selectedFiles,
  loading,
  searchTerm,
  filterType,
  sortBy,
  sortOrder,
  onFileSelect,
  onMultiSelect,
  onNavigate,
  onUpload,
  onDelete,
  onRename,
  onCreateFolder,
  onDownload,
  onDownloadFolder,
  onShare,
  onGetFileUrl,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [shareExpiresIn, setShareExpiresIn] = useState(3600);
  const [shareUrl, setShareUrl] = useState("");
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const pathSegments = currentPath.split("/").filter(Boolean);

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((file) => {
        // Only show folders when "all" is selected, not for specific file types
        if (file.type === "folder") return false;

        const extension = file.extension?.toLowerCase() || "";
        const mimeType = file.mimeType || "";

        switch (filterType) {
          case "images":
            return mimeType.startsWith("image/");
          case "videos":
            return mimeType.startsWith("video/");
          case "audio":
            return mimeType.startsWith("audio/");
          case "documents":
            return [
              "pdf",
              "doc",
              "docx",
              "xls",
              "xlsx",
              "ppt",
              "pptx",
            ].includes(extension);
          case "code":
            return [
              "js",
              "ts",
              "html",
              "css",
              "json",
              "xml",
              "txt",
              "md",
              "py",
              "java",
              "cpp",
              "c",
            ].includes(extension);
          case "archives":
            return ["zip", "rar", "7z", "tar", "gz"].includes(extension);
          case "others":
            return ![
              "images",
              "videos",
              "audio",
              "documents",
              "code",
              "archives",
            ].some((type) => {
              switch (type) {
                case "images":
                  return mimeType.startsWith("image/");
                case "videos":
                  return mimeType.startsWith("video/");
                case "audio":
                  return mimeType.startsWith("audio/");
                case "documents":
                  return [
                    "pdf",
                    "doc",
                    "docx",
                    "xls",
                    "xlsx",
                    "ppt",
                    "pptx",
                  ].includes(extension);
                case "code":
                  return [
                    "js",
                    "ts",
                    "html",
                    "css",
                    "json",
                    "xml",
                    "txt",
                    "md",
                  ].includes(extension);
                case "archives":
                  return ["zip", "rar", "7z", "tar", "gz"].includes(extension);
                default:
                  return false;
              }
            });
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      // Always show folders first
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "lastModified":
          comparison =
            new Date(a.lastModified).getTime() -
            new Date(b.lastModified).getTime();
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [files, searchTerm, filterType, sortBy, sortOrder]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        await onUpload(files, currentPath);
        toast({
          title: "Upload Successful",
          description: `${files.length} file(s) uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Upload failed",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (file: FileItem) => {
    if (file.type === "folder") {
      onNavigate(file.key);
    } else {
      onFileSelect(file);
    }
  };

  const handleMultiSelect = (file: FileItem, checked: boolean) => {
    if (checked) {
      onMultiSelect([...selectedFiles, file]);
    } else {
      onMultiSelect(selectedFiles.filter((f) => f.key !== file.key));
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredAndSortedFiles.length) {
      // Deselect all if all are currently selected
      onMultiSelect([]);
    } else {
      // Select all files
      onMultiSelect(filteredAndSortedFiles);
    }
  };

  const handleDownloadSelected = async () => {
    for (const file of selectedFiles) {
      try {
        if (file.type === "file") {
          await onDownload(file);
        } else if (file.type === "folder") {
          await onDownloadFolder(file);
        }
      } catch (error) {
        toast({
          title: "Download Failed",
          description: `Failed to download ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    }
    const fileCount = selectedFiles.filter((f) => f.type === "file").length;
    const folderCount = selectedFiles.filter((f) => f.type === "folder").length;
    if (fileCount > 0 || folderCount > 0) {
      toast({
        title: "Downloads Started",
        description: `Started downloading ${fileCount} file(s) and ${folderCount} folder(s)`,
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        await onUpload(files, currentPath);
        toast({
          title: "Upload Successful",
          description: `${files.length} file(s) uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Upload failed",
          variant: "destructive",
        });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await onCreateFolder(newFolderName.trim());
        setShowCreateFolder(false);
        setNewFolderName("");
        toast({
          title: "Folder Created",
          description: `Folder "${newFolderName}" created successfully`,
        });
      } catch (error) {
        toast({
          title: "Create Folder Failed",
          description:
            error instanceof Error ? error.message : "Failed to create folder",
          variant: "destructive",
        });
      }
    }
  };

  const handleRename = async () => {
    if (fileToRename && renameName.trim()) {
      try {
        const { extension } = getFileNameAndExtension(
          fileToRename.name,
          fileToRename.type === "file"
        );
        const finalName =
          fileToRename.type === "file"
            ? renameName.trim() + extension
            : renameName.trim();

        await onRename(fileToRename, finalName);
        setShowRename(false);
        setRenameName("");
        setFileToRename(null);
        toast({
          title: "Rename Successful",
          description: `Renamed to "${finalName}"`,
        });
      } catch (error) {
        toast({
          title: "Rename Failed",
          description: error instanceof Error ? error.message : "Rename failed",
          variant: "destructive",
        });
      }
    }
  };

  const handleShare = async () => {
    if (fileToShare) {
      try {
        const url = await onShare(fileToShare, shareExpiresIn);
        setShareUrl(url);
        toast({
          title: "Share Link Generated",
          description: "Share link has been generated successfully",
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to generate share link",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async () => {
    const filesToDelete =
      selectedFiles.length > 0
        ? selectedFiles
        : selectedFile
        ? [selectedFile]
        : [];
    if (filesToDelete.length > 0) {
      try {
        await onDelete(filesToDelete);
        toast({
          title: "Delete Successful",
          description: `${filesToDelete.length} item(s) deleted successfully`,
        });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: error instanceof Error ? error.message : "Delete failed",
          variant: "destructive",
        });
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") return Folder;

    const mimeType = file.mimeType || "";
    const extension = file.extension?.toLowerCase() || "";

    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)
    )
      return FileText;
    if (
      ["js", "ts", "html", "css", "json", "xml", "txt", "md"].includes(
        extension
      )
    )
      return Code;
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return Archive;

    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getFileNameAndExtension = (fileName: string, isFile: boolean) => {
    if (!isFile) {
      return { name: fileName, extension: "" };
    }

    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex <= 0) {
      return { name: fileName, extension: "" };
    }

    return {
      name: fileName.substring(0, lastDotIndex),
      extension: fileName.substring(lastDotIndex),
    };
  };

  const loadImageUrl = React.useCallback(
    async (file: FileItem) => {
      if (
        !onGetFileUrl ||
        file.type !== "file" ||
        !file.mimeType?.startsWith("image/")
      ) {
        return;
      }

      if (imageUrls[file.key]) {
        return; // Already loaded
      }

      try {
        const url = await onGetFileUrl(file);
        setImageUrls((prev) => ({
          ...prev,
          [file.key]: url,
        }));
      } catch (error) {
        console.error("Failed to load image URL:", error);
      }
    },
    [onGetFileUrl, imageUrls]
  );

  // Load image URLs for visible images
  React.useEffect(() => {
    if (viewMode === "grid" && onGetFileUrl) {
      filteredAndSortedFiles
        .filter(
          (file) => file.type === "file" && file.mimeType?.startsWith("image/")
        )
        .forEach((file) => {
          if (!imageUrls[file.key]) {
            loadImageUrl(file);
          }
        });
    }
  }, [filteredAndSortedFiles, viewMode, onGetFileUrl, imageUrls, loadImageUrl]);

  const renderGridView = () => {
    return (
      <div className="p-6">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 150px))",
            justifyContent: "start",
          }}
        >
          {filteredAndSortedFiles.map((file) => {
            const Icon = getFileIcon(file);
            const isSelected = selectedFiles.some((f) => f.key === file.key);
            const isImage =
              file.type === "file" && file.mimeType?.startsWith("image/");
            const imageUrl = imageUrls[file.key];

            return (
              <Card
                key={file.key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedFile?.key === file.key
                    ? "border-blue-500 bg-blue-50"
                    : ""
                } ${isSelected ? "ring-2 ring-blue-400" : ""}`}
                style={{ width: "150px" }}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="relative">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleMultiSelect(file, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 left-2 z-10 bg-white shadow-sm"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {file.type === "file" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onDownload(file)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setFileToShare(file);
                                  setShowShare(true);
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            </>
                          )}
                          {file.type === "folder" && (
                            <DropdownMenuItem
                              onClick={() => onDownloadFolder(file)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Folder
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setFileToRename(file);
                              const { name } = getFileNameAndExtension(
                                file.name,
                                file.type === "file"
                              );
                              setRenameName(name);
                              setShowRename(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete([file])}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div
                        className="flex items-center justify-center h-20 w-full bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleFileSelect(file)}
                      >
                        {isImage && imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={file.name}
                            className="h-full w-full object-cover rounded"
                            onError={() => {
                              // Remove failed URL from cache
                              setImageUrls((prev) => {
                                const newUrls = { ...prev };
                                delete newUrls[file.key];
                                return newUrls;
                              });
                            }}
                          />
                        ) : file.type === "folder" ? (
                          <Folder className="h-12 w-12 text-blue-600" />
                        ) : (
                          <Icon className="h-12 w-12 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p
                        className="text-sm font-medium truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        {file.type === "file" && (
                          <p>{formatFileSize(file.size)}</p>
                        )}
                        <p>{formatDate(file.lastModified)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="p-6">
      <div className="space-y-2">
        {filteredAndSortedFiles.map((file) => {
          const Icon = getFileIcon(file);
          const isSelected = selectedFiles.some((f) => f.key === file.key);

          return (
            <Card
              key={file.key}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedFile?.key === file.key
                  ? "border-blue-500 bg-blue-50"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleMultiSelect(file, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Icon
                      className={`h-5 w-5 ${
                        file.type === "folder"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleFileSelect(file)}
                    >
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {file.type === "file" && (
                          <span>{formatFileSize(file.size)}</span>
                        )}
                        <span>{formatDate(file.lastModified)}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.type === "file" && (
                        <>
                          <DropdownMenuItem onClick={() => onDownload(file)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setFileToShare(file);
                              setShowShare(true);
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        </>
                      )}
                      {file.type === "folder" && (
                        <DropdownMenuItem
                          onClick={() => onDownloadFolder(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Folder
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setFileToRename(file);
                          const { name } = getFileNameAndExtension(
                            file.name,
                            file.type === "file"
                          );
                          setRenameName(name);
                          setShowRename(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete([file])}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("")}
              className="flex items-center space-x-1"
            >
              <Home className="h-4 w-4" />
              <span>Root</span>
            </Button>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onNavigate(pathSegments.slice(0, index + 1).join("/") + "/")
                  }
                >
                  {segment}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(currentPath)}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center space-x-2"
            >
              <FolderPlus className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center space-x-2"
            >
              <Checkbox
                checked={
                  filteredAndSortedFiles.length > 0 &&
                  selectedFiles.length === filteredAndSortedFiles.length
                }
                className="mr-1"
              />
              <span>Select All</span>
            </Button>
            {selectedFiles.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelected}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download ({selectedFiles.length})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedFiles.length})</span>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-l-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleUploadClick}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div
        className={`flex-1 overflow-auto ${
          dragOver ? "bg-blue-50" : "bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files found</p>
              <p className="text-sm text-gray-400 mt-2">
                Drag and drop files here or click Upload to get started
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          renderGridView()
        ) : (
          renderListView()
        )}
      </div>

      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 flex items-center justify-center">
          <div className="text-center">
            <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-blue-700">
              Drop files here to upload
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Dialogs */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateFolder(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rename {fileToRename?.type === "folder" ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for "{fileToRename?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {fileToRename?.type === "file" ? (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="newName">File Name</Label>
                  <Input
                    id="newName"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    placeholder="Enter file name"
                  />
                </div>
                <div className="w-24">
                  <Label htmlFor="extension">Extension</Label>
                  <Input
                    id="extension"
                    value={
                      getFileNameAndExtension(fileToRename.name, true).extension
                    }
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="newName">New Name</Label>
                <Input
                  id="newName"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="Enter new name"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              Generate a temporary share link for "{fileToShare?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expiresIn">Expires In</Label>
              <Select
                value={shareExpiresIn.toString()}
                onValueChange={(value) => setShareExpiresIn(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3600">1 Hour</SelectItem>
                  <SelectItem value="21600">6 Hours</SelectItem>
                  <SelectItem value="86400">24 Hours</SelectItem>
                  <SelectItem value="604800">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {shareUrl && (
              <div>
                <Label htmlFor="shareUrl">Share URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="shareUrl"
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={() => copyToClipboard(shareUrl)}>
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShare(false)}>
              Close
            </Button>
            {!shareUrl && <Button onClick={handleShare}>Generate Link</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
