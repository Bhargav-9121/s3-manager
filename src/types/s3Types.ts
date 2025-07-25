
export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
}

export interface FileItem {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  type: 'file' | 'folder';
  mimeType?: string;
  extension?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface ShareSettings {
  expiresIn: number;
  unit: 'minutes' | 'hours' | 'days';
}

export type FileType = 'all' | 'images' | 'videos' | 'audio' | 'documents' | 'code' | 'archives' | 'others';
export type SortBy = 'name' | 'size' | 'lastModified';
export type SortOrder = 'asc' | 'desc';
