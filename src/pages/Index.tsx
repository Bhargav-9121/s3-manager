import React, { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { FileManagerSidebar } from "@/components/FileManagerSidebar";
import { S3ConnectionForm } from "@/components/S3ConnectionForm";
import { FileBrowser } from "@/components/FileBrowser";
import { FilePreview } from "@/components/FilePreview";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { S3Service } from "@/services/S3Service";
import {
  FileItem,
  S3Credentials,
  FileType,
  SortBy,
  SortOrder,
} from "@/types/s3Types";
import { Cloud } from "lucide-react";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [credentials, setCredentials] = useState<S3Credentials | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FileType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleConnect = useCallback(async (creds: S3Credentials) => {
    setLoading(true);
    try {
      const s3Service = new S3Service(creds);
      await s3Service.testConnection();
      setCredentials(creds);
      setIsConnected(true);
      // Load files directly here to avoid dependency issues
      const fileList = await s3Service.listFiles("");
      setFiles(fileList);
      setCurrentPath("");
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for stored credentials on app load
    const storedCredentials = localStorage.getItem("s3-credentials");
    if (storedCredentials) {
      try {
        const parsed = JSON.parse(storedCredentials);
        setCredentials(parsed);
        handleConnect(parsed);
      } catch (error) {
        console.error("Error parsing stored credentials:", error);
        localStorage.removeItem("s3-credentials");
      }
    }
  }, [handleConnect]);

  const handleDisconnect = () => {
    setIsConnected(false);
    setCredentials(null);
    setFiles([]);
    setSelectedFile(null);
    setSelectedFiles([]);
    setCurrentPath("");
    localStorage.removeItem("s3-credentials");
  };

  const loadFiles = async (path: string) => {
    if (!credentials) return;

    setLoading(true);
    try {
      const s3Service = new S3Service(credentials);
      const fileList = await s3Service.listFiles(path);
      setFiles(fileList);
      setCurrentPath(path);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleMultiSelect = (files: FileItem[]) => {
    setSelectedFiles(files);
  };

  const handleNavigate = (path: string) => {
    loadFiles(path);
  };

  const handleUpload = async (files: File[], path: string) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);

    for (const file of files) {
      try {
        await s3Service.uploadFile(file, path);
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      }
    }

    await loadFiles(currentPath);
  };

  const handleDelete = async (filesToDelete: FileItem[]) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);

    for (const file of filesToDelete) {
      try {
        await s3Service.deleteFile(file.key);
      } catch (error) {
        console.error("Delete failed:", error);
        throw error;
      }
    }

    await loadFiles(currentPath);
    setSelectedFiles([]);
    setSelectedFile(null);
  };

  const handleRename = async (file: FileItem, newName: string) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);
    try {
      await s3Service.renameFile(file.key, newName);
      await loadFiles(currentPath);
    } catch (error) {
      console.error("Rename failed:", error);
      throw error;
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);
    try {
      const folderPath = currentPath
        ? `${currentPath}${folderName}/`
        : `${folderName}/`;
      await s3Service.createFolder(folderPath);
      await loadFiles(currentPath);
    } catch (error) {
      console.error("Create folder failed:", error);
      throw error;
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);
    try {
      await s3Service.downloadFile(file.key, file.name);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };

  const handleShare = async (file: FileItem, expiresIn: number) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);
    try {
      return await s3Service.generatePresignedUrl(file.key, expiresIn);
    } catch (error) {
      console.error("Share failed:", error);
      throw error;
    }
  };

  const handleDownloadFolder = async (folder: FileItem) => {
    if (!credentials) return;

    const s3Service = new S3Service(credentials);
    try {
      // Get all files in the folder
      const folderContents = await s3Service.downloadFolderContents(folder.key);

      if (folderContents.length === 0) {
        throw new Error("Folder is empty or contains no downloadable files");
      }

      // Create a new ZIP file
      const zip = new JSZip();

      // Add all files to the ZIP
      for (const fileContent of folderContents) {
        zip.file(fileContent.path, fileContent.content);
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folder.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Folder download failed:", error);
      throw error;
    }
  };

  const handleGetFileUrl = async (file: FileItem) => {
    if (!credentials) throw new Error("No credentials available");

    const s3Service = new S3Service(credentials);
    try {
      return await s3Service.getFileUrl(file.key);
    } catch (error) {
      console.error("Get file URL failed:", error);
      throw error;
    }
  };

  if (!isConnected || !credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              S3 File Manager
            </h1>
            <p className="text-lg text-gray-600 p-0 m-0">
              Connect to your AWS S3 bucket to manage files with ease
            </p>
          </div>
          <S3ConnectionForm onConnect={handleConnect} loading={loading} />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <FileManagerSidebar
          onDisconnect={handleDisconnect}
          currentPath={currentPath}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          bucketName={credentials?.bucketName || ""}
        />

        <main className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <FileBrowser
              files={files}
              currentPath={currentPath}
              selectedFile={selectedFile}
              selectedFiles={selectedFiles}
              loading={loading}
              searchTerm={searchTerm}
              filterType={filterType}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onFileSelect={handleFileSelect}
              onMultiSelect={handleMultiSelect}
              onNavigate={handleNavigate}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onRename={handleRename}
              onCreateFolder={handleCreateFolder}
              onDownload={handleDownload}
              onDownloadFolder={handleDownloadFolder}
              onShare={handleShare}
              onGetFileUrl={handleGetFileUrl}
            />
          </div>

          {selectedFile && (
            <div className="w-80 border-l bg-white">
              <FilePreview
                file={selectedFile}
                credentials={credentials}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          )}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default Index;
