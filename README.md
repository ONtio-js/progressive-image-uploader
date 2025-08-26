# 🖼️ Vanilla Image Uploader

A lightweight, framework-agnostic image uploader component with drag & drop support, built in pure JavaScript.

## ✨ Features

- **🚀 Zero Dependencies** - Pure vanilla JavaScript
- **📱 Responsive Design** - Works on desktop and mobile
- **🖱️ Drag & Drop** - Intuitive drag and drop interface
- **👆 Click to Browse** - Traditional file picker fallback
- **📸 Image Previews** - Thumbnail previews with remove option
- **📊 Progress Tracking** - Upload progress indicators
- **✅ File Validation** - Size, type, and count restrictions
- **🎨 Customizable** - Flexible styling and configuration
- **🌐 Universal** - Works with any framework or vanilla JS

## 📦 Installation

```bash
npm install vanilla-image-uploader
```

## 🚀 Quick Start

### ES6 Modules
```javascript
import ImageUploader from 'vanilla-image-uploader';

const uploader = new ImageUploader('#uploader-container', {
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  onUpload: async (file, progressCallback) => {
    // Your upload logic here
    return await uploadToServer(file, progressCallback);
  }
});
```

### CommonJS
```javascript
const ImageUploader = require('vanilla-image-uploader');

const uploader = new ImageUploader('#uploader-container', options);
```

### Browser Script Tag
```html
<script src="node_modules/vanilla-image-uploader/dist/index.min.js"></script>
<script>
  const uploader = new ImageUploader('#uploader-container', options);
</script>
```

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxFiles` | Number | `10` | Maximum number of files allowed |
| `maxFileSize` | Number | `10485760` | Maximum file size in bytes (10MB) |
| `acceptedTypes` | Array | `['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']` | Allowed file MIME types |
| `multiple` | Boolean | `true` | Allow multiple file selection |
| `dragDropText` | String | `'Drag & drop images here or click to browse'` | Text shown in drop zone |
| `browseText` | String | `'Browse Files'` | Browse button text |
| `uploadText` | String | `'Upload Images'` | Upload button text |
| `removeText` | String | `'×'` | Remove button text |
| `theme` | String | `'default'` | CSS theme class |

## 📋 Event Callbacks

### `onFilesAdded(files)`
Called when files are added to the uploader.
```javascript
onFilesAdded: (files) => {
  console.log('Files added:', files);
}
```

### `onFileRemoved(file)`
Called when a file is removed.
```javascript
onFileRemoved: (file) => {
  console.log('File removed:', file.name);
}
```

### `onUpload(file, progressCallback)`
**Required** - Handle the actual file upload. Must return a Promise.
```javascript
onUpload: async (file, progressCallback) => {
  const formData = new FormData();
  formData.append('image', file);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressCallback(percent);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', '/upload');
    xhr.send(formData);
  });
}
```

### `onUploadProgress(file, percent)`
Called during upload progress.
```javascript
onUploadProgress: (file, percent) => {
  console.log(`${file.name}: ${percent}%`);
}
```

### `onUploadComplete(files)`
Called when all uploads are complete.
```javascript
onUploadComplete: (files) => {
  console.log('All uploads complete:', files);
}
```

### `onError(message)`
Called when an error occurs.
```javascript
onError: (message) => {
  alert('Error: ' + message);
}
```

## 🎯 API Methods

### `getFiles()`
Returns array of currently selected files.
```javascript
const files = uploader.getFiles();
```

### `getUploadedFiles()`
Returns array of successfully uploaded files.
```javascript
const uploadedFiles = uploader.getUploadedFiles();
```

### `clear()`
Removes all files from the uploader.
```javascript
uploader.clear();
```

### `destroy()`
Cleanup and remove the uploader from DOM.
```javascript
uploader.destroy();
```

## 🎨 Styling

The component includes default styles, but you can customize the appearance:

### CSS Custom Properties
```css
.image-uploader {
  --upload-border-color: #ccc;
  --upload-hover-color: #007bff;
  --upload-background: #f8f9fa;
  --button-primary: #007bff;
  --button-success: #28a745;
  --button-danger: #dc3545;
}
```

### Custom Themes
```javascript
const uploader = new ImageUploader('#container', {
  theme: 'dark-theme' // Adds 'dark-theme' class to root element
});
```

### Override Styles
```css
.image-uploader.custom-theme .upload-area {
  border: 3px solid #ff6b6b;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 📱 Framework Integration

### React
```jsx
import { useEffect, useRef } from 'react';
import ImageUploader from 'vanilla-image-uploader';

function MyComponent() {
  const uploaderRef = useRef();
  
  useEffect(() => {
    const uploader = new ImageUploader(uploaderRef.current, {
      onUpload: async (file, progress) => {
        // Handle upload
      }
    });
    
    return () => uploader.destroy();
  }, []);
  
  return <div ref={uploaderRef}></div>;
}
```

### Vue
```vue
<template>
  <div ref="uploader"></div>
</template>

<script>
import ImageUploader from 'vanilla-image-uploader';

export default {
  mounted() {
    this.uploader = new ImageUploader(this.$refs.uploader, {
      onUpload: async (file, progress) => {
        // Handle upload
      }
    });
  },
  beforeUnmount() {
    this.uploader?.destroy();
  }
}
</script>
```

## 🌟 Examples

### Basic Upload to Server
```javascript
const uploader = new ImageUploader('#uploader', {
  maxFiles: 3,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  onUpload: async (file, progressCallback) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return await response.json();
  },
  onUploadComplete: (files) => {
    alert(`Uploaded ${files.length} files successfully!`);
  }
});
```

### Upload to AWS S3 with Progress
```javascript
const uploader = new ImageUploader('#uploader', {
  onUpload: async (file, progressCallback) => {
    // Get signed URL from your backend
    const { uploadUrl } = await fetch('/api/s3-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    }).then(r => r.json());
    
    // Upload directly to S3
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          progressCallback((e.loaded / e.total) * 100);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve({ url: uploadUrl.split('?')[0] });
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Changelog

### v1.0.0
- Initial release
- Drag & drop functionality
- File validation
- Progress tracking
- Framework-agnostic design