# 🗂️ S3 Bucket Manager

A modern, feature-rich web application for managing AWS S3 buckets with an intuitive file browser interface. Built with React, TypeScript, and Tailwind CSS.

![S3 Bucket Browser](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![AWS S3](https://img.shields.io/badge/AWS-S3-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

### 🔐 Secure Authentication

- **Local credential storage** - Your AWS credentials are stored securely in your browser's local storage
- **IAM integration** - Works with AWS IAM users and roles
- **Session persistence** - Remember credentials option for seamless experience

### 📁 File Management

- **Drag & drop uploads** - Simply drag files to upload them
- **Folder creation** - Create and organize folders directly in the interface
- **Bulk operations** - Select multiple files for batch operations
- **File deletion** - Delete files and folders with confirmation
- **File renaming** - Rename files and folders in-place

### 🎨 Modern Interface

- **Dual view modes** - Switch between grid view (large icons) and list view
- **Image thumbnails** - Preview images directly in the grid view
- **File type icons** - Visual icons for different file types (images, videos, documents, etc.)
- **Responsive design** - Works perfectly on desktop and mobile devices

### 🔍 Advanced Features

- **Smart search** - Search files and folders by name
- **File type filtering** - Filter by images, videos, audio, documents, code files, and archives
- **Sorting options** - Sort by name, size, or last modified date
- **Download capabilities** - Download individual files or entire folders as ZIP archives
- **File sharing** - Generate shareable URLs for your S3 objects

### 📊 File Type Support

- **Images**: JPG, PNG, GIF, WebP, SVG
- **Videos**: MP4, AVI, MOV, WebM
- **Audio**: MP3, WAV, OGG, M4A
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Code**: JS, TS, HTML, CSS, JSON, XML, TXT, MD
- **Archives**: ZIP, RAR, 7Z, TAR, GZ

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS account with S3 access
- AWS IAM user with appropriate S3 permissions

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Bhargav-9121/s3-manager
   cd s3-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## ⚙️ AWS Configuration

### 1. IAM Permissions

Your AWS IAM user needs these S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### 2. CORS Configuration

Configure your S3 bucket's CORS policy:

1. Go to your AWS S3 Console
2. Select your bucket → Permissions tab
3. Find "Cross-origin resource sharing (CORS)"
4. Click Edit and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:*",
      "https://localhost:*",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **AWS Integration**: AWS SDK for JavaScript v3
- **File Operations**: JSZip for folder downloads
- **Icons**: Lucide React
- **State Management**: React hooks and context

## 📱 Screenshots

### Grid View

![Grid View](https://github.com/user-attachments/assets/a0ab03c6-cc7c-4f7b-a3e3-4bce83277389)
_Large icon view with image thumbnails and file type icons_

### List View

![List View](https://github.com/user-attachments/assets/15eb55c7-3125-4d92-acb3-5ada028bbafd)
_Detailed list view with file information_

### File Preview

![File Preview](https://github.com/user-attachments/assets/84ef059e-fde4-4b02-afb4-74653699caa4)
_Side panel preview for selected files_

## 🎯 Usage

### Connecting to S3

1. Enter your AWS credentials (Access Key ID, Secret Access Key)
2. Specify your AWS region (e.g., `us-east-1`)
3. Enter your S3 bucket name
4. Click "Connect to S3"

### Managing Files

- **Upload**: Click the upload button or drag & drop files
- **Create Folder**: Click the "New Folder" button
- **Download**: Select files and click download, or use the context menu
- **Delete**: Select files and click the delete button
- **Search**: Use the search bar in the sidebar
- **Filter**: Choose file types from the sidebar filters

### View Options

- **Grid View**: Large icons with image previews
- **List View**: Detailed table with file information
- Toggle between views using the view switcher in the toolbar

## 🔧 Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── FileBrowser.tsx # Main file browser component
│   └── S3ConnectionForm.tsx
├── services/           # AWS S3 service layer
├── types/              # TypeScript type definitions
├── pages/              # Application pages
└── lib/                # Utility functions
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

- Your AWS credentials are stored locally in your browser and never sent to any external servers
- Always use IAM users with minimal required permissions
- Consider using temporary credentials or AWS STS for enhanced security
- Keep your AWS credentials secure and never commit them to version control

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚨 Troubleshooting

### Common Issues

**CORS Errors**

- Ensure your S3 bucket has the correct CORS configuration
- Verify that your domain is included in the CORS allowed origins

**Upload Failures**

- Check your IAM permissions include `s3:PutObject`
- Verify the bucket name is correct
- Ensure you have sufficient S3 storage quota

**Connection Issues**

- Verify your AWS credentials are correct
- Check that the specified region matches your bucket's region
- Ensure your IAM user has `s3:ListBucket` permission

## 📞 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the troubleshooting section above
- Review the AWS S3 documentation for bucket configuration

---

**Made with ❤️ for the developer community**
