class ImageUploader {
	constructor(selector, options = {}) {
		this.container =
			typeof selector === 'string'
				? document.querySelector(selector)
				: selector;

		if (!this.container) {
			throw new Error('ImageUploader: Container element not found');
		}

		// Default options
		this.options = {
			maxFiles: 10,
			maxFileSize: 10 * 1024 * 1024, // 10MB
			acceptedTypes: [
				'image/jpeg',
				'image/jpg',
				'image/png',
				'image/gif',
				'image/webp',
			],
			multiple: true,
			dragDropText: 'Drag & drop images here or click to browse',
			browseText: 'Browse Files',
			uploadText: 'Upload Images',
			removeText: '×',
			onFilesAdded: null,
			onFileRemoved: null,
			onUpload: null,
			onUploadProgress: null,
			onUploadComplete: null,
			onError: null,
			theme: 'default',
			...options,
		};

		this.files = [];
		this.uploading = false;

		this.init();
	}

	init() {
		this.createHTML();
		this.attachEvents();
		this.applyStyles();
	}

	createHTML() {
		this.container.innerHTML = `
      <div class="image-uploader ${this.options.theme}">
        <div class="upload-area" data-uploader="drop-zone">
          <div class="upload-icon">📁</div>
          <div class="upload-text">${this.options.dragDropText}</div>
          <button type="button" class="browse-btn" data-uploader="browse">
            ${this.options.browseText}
          </button>
          <input 
            type="file" 
            class="file-input" 
            data-uploader="file-input"
            accept="${this.options.acceptedTypes.join(',')}"
            ${this.options.multiple ? 'multiple' : ''}
            hidden
          >
        </div>
        <div class="preview-area" data-uploader="preview"></div>
        <div class="upload-controls" data-uploader="controls" style="display: none;">
          <button type="button" class="upload-btn" data-uploader="upload">
            ${this.options.uploadText}
          </button>
          <div class="upload-progress" data-uploader="progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <span class="progress-text">0%</span>
          </div>
        </div>
      </div>
    `;
	}

	attachEvents() {
		const dropZone = this.container.querySelector(
			'[data-uploader="drop-zone"]'
		);
		const fileInput = this.container.querySelector(
			'[data-uploader="file-input"]'
		);
		const browseBtn = this.container.querySelector(
			'[data-uploader="browse"]'
		);
		const uploadBtn = this.container.querySelector(
			'[data-uploader="upload"]'
		);

		// Drag and drop events
		dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
		dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
		dropZone.addEventListener('drop', this.handleDrop.bind(this));

		// Click events
		browseBtn.addEventListener('click', () => fileInput.click());
		fileInput.addEventListener('change', this.handleFileSelect.bind(this));
		uploadBtn.addEventListener('click', this.startUpload.bind(this));
	}

	handleDragOver(e) {
		e.preventDefault();
		e.stopPropagation();
		e.currentTarget.classList.add('drag-over');
	}

	handleDragLeave(e) {
		e.preventDefault();
		e.stopPropagation();
		e.currentTarget.classList.remove('drag-over');
	}

	handleDrop(e) {
		e.preventDefault();
		e.stopPropagation();
		e.currentTarget.classList.remove('drag-over');

		const files = Array.from(e.dataTransfer.files);
		this.addFiles(files);
	}

	handleFileSelect(e) {
		const files = Array.from(e.target.files);
		this.addFiles(files);
		e.target.value = ''; // Reset input
	}

	addFiles(newFiles) {
		const validFiles = newFiles.filter((file) => this.validateFile(file));

		if (this.files.length + validFiles.length > this.options.maxFiles) {
			this.showError(`Maximum ${this.options.maxFiles} files allowed`);
			validFiles.splice(this.options.maxFiles - this.files.length);
		}

		validFiles.forEach((file) => {
			const fileObj = {
				file,
				id: Date.now() + Math.random(),
				preview: null,
				uploaded: false,
				progress: 0,
			};

			this.files.push(fileObj);
			this.createPreview(fileObj);
		});

		this.updateUI();

		if (this.options.onFilesAdded && validFiles.length > 0) {
			this.options.onFilesAdded(validFiles);
		}
	}

	validateFile(file) {
		// Check file type
		if (!this.options.acceptedTypes.includes(file.type)) {
			this.showError(`${file.name}: Invalid file type`);
			return false;
		}

		// Check file size
		if (file.size > this.options.maxFileSize) {
			const maxSizeMB = (
				this.options.maxFileSize /
				(1024 * 1024)
			).toFixed(1);
			this.showError(`${file.name}: File too large (max ${maxSizeMB}MB)`);
			return false;
		}

		return true;
	}

	createPreview(fileObj) {
		const previewArea = this.container.querySelector(
			'[data-uploader="preview"]'
		);

		const previewEl = document.createElement('div');
		previewEl.className = 'preview-item';
		previewEl.dataset.fileId = fileObj.id;

		const reader = new FileReader();
		reader.onload = (e) => {
			previewEl.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="preview-image">
        <div class="preview-overlay">
          <button type="button" class="remove-btn" data-action="remove">
            ${this.options.removeText}
          </button>
        </div>
        <div class="preview-progress" style="display: none;">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="file-name">${fileObj.file.name}</div>
      `;

			// Attach remove event
			previewEl
				.querySelector('[data-action="remove"]')
				.addEventListener('click', () => this.removeFile(fileObj.id));
		};

		reader.readAsDataURL(fileObj.file);
		previewArea.appendChild(previewEl);
	}

	removeFile(fileId) {
		const index = this.files.findIndex((f) => f.id === fileId);
		if (index > -1) {
			const file = this.files[index];
			this.files.splice(index, 1);

			const previewEl = this.container.querySelector(
				`[data-file-id="${fileId}"]`
			);
			if (previewEl) previewEl.remove();

			this.updateUI();

			if (this.options.onFileRemoved) {
				this.options.onFileRemoved(file.file);
			}
		}
	}

	updateUI() {
		const controls = this.container.querySelector(
			'[data-uploader="controls"]'
		);
		const uploadBtn = this.container.querySelector(
			'[data-uploader="upload"]'
		);

		if (this.files.length > 0) {
			controls.style.display = 'block';
			uploadBtn.disabled = this.uploading;
		} else {
			controls.style.display = 'none';
		}
	}

	async startUpload() {
		if (!this.options.onUpload || this.uploading) return;

		this.uploading = true;
		const uploadBtn = this.container.querySelector(
			'[data-uploader="upload"]'
		);
		const progressContainer = this.container.querySelector(
			'[data-uploader="progress"]'
		);

		uploadBtn.disabled = true;
		progressContainer.style.display = 'block';

		try {
			for (let i = 0; i < this.files.length; i++) {
				const fileObj = this.files[i];
				if (fileObj.uploaded) continue;

				await this.uploadFile(fileObj);
			}

			if (this.options.onUploadComplete) {
				this.options.onUploadComplete(this.files.map((f) => f.file));
			}
		} catch (error) {
			this.showError(`Upload failed: ${error.message}`);
		} finally {
			this.uploading = false;
			uploadBtn.disabled = false;
			progressContainer.style.display = 'none';
		}
	}

	async uploadFile(fileObj) {
		const previewEl = this.container.querySelector(
			`[data-file-id="${fileObj.id}"]`
		);
		const progressEl = previewEl?.querySelector('.preview-progress');
		const fillEl = previewEl?.querySelector('.progress-fill');

		if (progressEl) progressEl.style.display = 'block';

		const progressCallback = (percent) => {
			fileObj.progress = percent;
			if (fillEl) fillEl.style.width = `${percent}%`;

			if (this.options.onUploadProgress) {
				this.options.onUploadProgress(fileObj.file, percent);
			}
		};

		try {
			await this.options.onUpload(fileObj.file, progressCallback);
			fileObj.uploaded = true;

			if (previewEl) previewEl.classList.add('uploaded');
			if (progressEl) progressEl.style.display = 'none';
		} catch (error) {
			if (previewEl) previewEl.classList.add('error');
			throw error;
		}
	}

	showError(message) {
		if (this.options.onError) {
			this.options.onError(message);
		} else {
			console.error('ImageUploader:', message);
			// You could also create a toast notification here
		}
	}

	applyStyles() {
		// Inject basic styles if not already present
		if (!document.querySelector('#image-uploader-styles')) {
			const style = document.createElement('style');
			style.id = 'image-uploader-styles';
			style.textContent = this.getDefaultStyles();
			document.head.appendChild(style);
		}
	}

	getDefaultStyles() {
		return `
      .image-uploader {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 100%;
      }
      
      .upload-area {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 40px 20px;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .upload-area:hover,
      .upload-area.drag-over {
        border-color: #007bff;
        background-color: #f8f9fa;
      }
      
      .upload-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .upload-text {
        font-size: 16px;
        color: #666;
        margin-bottom: 16px;
      }
      
      .browse-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .browse-btn:hover {
        background: #0056b3;
      }
      
      .preview-area {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
        margin: 20px 0;
      }
      
      .preview-item {
        position: relative;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        background: white;
      }
      
      .preview-item.uploaded {
        border-color: #28a745;
      }
      
      .preview-item.error {
        border-color: #dc3545;
      }
      
      .preview-image {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
      }
      
      .preview-overlay {
        position: absolute;
        top: 0;
        right: 0;
      }
      
      .remove-btn {
        background: rgba(220, 53, 69, 0.9);
        color: white;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .preview-progress {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(0, 0, 0, 0.1);
      }
      
      .progress-fill {
        height: 100%;
        background: #007bff;
        transition: width 0.3s ease;
      }
      
      .file-name {
        padding: 8px;
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .upload-controls {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 20px;
      }
      
      .upload-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .upload-btn:hover:not(:disabled) {
        background: #1e7e34;
      }
      
      .upload-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .upload-progress {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .progress-bar {
        width: 200px;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .progress-text {
        font-size: 14px;
        color: #666;
        min-width: 40px;
      }
    `;
	}

	// Public API methods
	getFiles() {
		return this.files.map((f) => f.file);
	}

	getUploadedFiles() {
		return this.files.filter((f) => f.uploaded).map((f) => f.file);
	}

	clear() {
		this.files = [];
		this.container.querySelector('[data-uploader="preview"]').innerHTML =
			'';
		this.updateUI();
	}

	destroy() {
		this.container.innerHTML = '';
		// Remove styles if needed
	}
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ImageUploader;
} else if (typeof define === 'function' && define.amd) {
	define(() => ImageUploader);
} else {
	window.ImageUploader = ImageUploader;
}
