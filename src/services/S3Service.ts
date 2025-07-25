import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Credentials, FileItem } from "@/types/s3Types";

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(credentials: S3Credentials) {
    this.s3Client = new S3Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
    this.bucketName = credentials.bucketName;
  }

  async testConnection(): Promise<void> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      });
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(
        `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async listFiles(prefix: string = ""): Promise<FileItem[]> {
    try {
      console.log(`Listing files with prefix: "${prefix}"`);
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        Delimiter: "/",
      });

      const response = await this.s3Client.send(command);
      console.log("S3 response:", response);
      const files: FileItem[] = [];

      // Add folders
      if (response.CommonPrefixes) {
        for (const folderPrefix of response.CommonPrefixes) {
          if (folderPrefix.Prefix) {
            const folderName = folderPrefix.Prefix.slice(prefix.length).replace(
              "/",
              ""
            );
            if (folderName) {
              files.push({
                key: folderPrefix.Prefix,
                name: folderName,
                size: 0,
                lastModified: new Date(),
                type: "folder",
              });
            }
          }
        }
      }

      // Add files
      if (response.Contents) {
        for (const object of response.Contents) {
          if (
            object.Key &&
            object.Key !== prefix &&
            !object.Key.endsWith("/")
          ) {
            const fileName = object.Key.slice(prefix.length);
            const extension = fileName.split(".").pop()?.toLowerCase();
            const mimeType = this.getMimeType(extension || "");

            files.push({
              key: object.Key,
              name: fileName,
              size: object.Size || 0,
              lastModified: object.LastModified || new Date(),
              type: "file",
              extension,
              mimeType,
            });
          }
        }
      }

      return files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error("Error in listFiles:", error);
      throw new Error(
        `Failed to list files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async uploadFile(file: File, path: string): Promise<void> {
    try {
      const key = path ? `${path}${file.name}` : file.name;

      // Convert File to ArrayBuffer for better compatibility
      const fileBuffer = await file.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(fileBuffer),
        ContentType: file.type,
        ContentLength: file.size,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async renameFile(oldKey: string, newName: string): Promise<void> {
    try {
      const pathParts = oldKey.split("/");
      pathParts[pathParts.length - 1] = newName;
      const newKey = pathParts.join("/");

      // Copy to new location
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${oldKey}`,
        Key: newKey,
      });

      await this.s3Client.send(copyCommand);

      // Delete old file
      await this.deleteFile(oldKey);
    } catch (error) {
      throw new Error(
        `Rename failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createFolder(folderPath: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: folderPath,
        Body: "",
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(
        `Create folder failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async downloadFile(key: string, fileName: string): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (response.Body) {
        const blob = await response.Body.transformToByteArray();
        const url = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      throw new Error(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async generatePresignedUrl(key: string, expiresIn: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(
        `Generate URL failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      throw new Error(
        `Get file URL failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async downloadFolderContents(
    folderKey: string
  ): Promise<{ path: string; content: ArrayBuffer }[]> {
    try {
      // Get all files in the folder recursively
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: folderKey,
      });

      const response = await this.s3Client.send(command);
      const files: { path: string; content: ArrayBuffer }[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && !object.Key.endsWith("/")) {
            // Download each file
            const fileCommand = new GetObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key,
            });

            const fileResponse = await this.s3Client.send(fileCommand);
            if (fileResponse.Body) {
              const arrayBuffer =
                await fileResponse.Body.transformToByteArray();
              files.push({
                path: object.Key.replace(folderKey, ""), // Remove folder prefix for relative path
                content: arrayBuffer.buffer,
              });
            }
          }
        }
      }

      return files;
    } catch (error) {
      throw new Error(
        `Download folder failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      webp: "image/webp",

      // Videos
      mp4: "video/mp4",
      avi: "video/avi",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      webm: "video/webm",

      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      flac: "audio/flac",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      // Code
      js: "text/javascript",
      ts: "text/typescript",
      html: "text/html",
      css: "text/css",
      json: "application/json",
      xml: "application/xml",
      txt: "text/plain",
      md: "text/markdown",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }
}
