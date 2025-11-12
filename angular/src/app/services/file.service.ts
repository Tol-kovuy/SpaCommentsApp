import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileUploadResult {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  previewUrl: string;
  textContent?: string;
}

export interface FileInfo {
  id: string;
  fileId?: string; 
  fileName: string;
  filePath: string;
  fileType: string;
  contentType: string;
  fileSize: number;
  width?: number;
  height?: number;
  content?: string;
}

export interface TextFileUploadResult {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  content?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = '/api/app/file';

  constructor(private http: HttpClient) { }
  uploadImage(file: File, commentId?: string): Observable<FileUploadResult> {
    const formData = new FormData();
    formData.append('File', file, file.name);

    if (commentId) {
      formData.append('CommentId', commentId);
    } else {
      formData.append('CommentId', '');
    }

    console.log('🖼️ Uploading image file...');
    for (let pair of (formData as any).entries()) {
      console.log('  ', pair[0] + ':', pair[1]);
    }

    return this.http.post<FileUploadResult>(
      `${this.apiUrl}/upload-image`,
      formData,
      {
        headers: { 'Accept': 'application/json' }
      }
    );
  }

  uploadTextFile(file: File): Observable<TextFileUploadResult> {
    const formData = new FormData();
    formData.append('File', file, file.name);

    console.log('🔄 Uploading text file...');

    return this.http.post<TextFileUploadResult>(
      `${this.apiUrl}/upload-text`, 
      formData,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
  }

  getFile(id: string): Observable<FileInfo> {
    return this.http.get<FileInfo>(`${this.apiUrl}/${id}`);
  }

  deleteFile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getFileUrl(id: string): string {
    return `${this.apiUrl}/${id}`;
  }

  getPreviewUrl(id: string): string {
    return `${this.apiUrl}/${id}`;
  }

  public createObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateImage(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Invalid image format. Allowed: JPG, PNG, GIF' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size should be less than 5MB' };
    }

    return { isValid: true };
  }

  validateTextFile(file: File): { isValid: boolean; error?: string } {
    const allowedExtension = '.txt';
    const maxSize = 100 * 1024;

    if (!file.name.toLowerCase().endsWith(allowedExtension)) {
      return { isValid: false, error: 'Only .txt files are allowed' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'Text file should be less than 100KB' };
    }

    return { isValid: true };
  }

  readTextFile(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        observer.next(e.target.result);
        observer.complete();
      };

      reader.onerror = (error) => {
        observer.error(error);
      };

      reader.readAsText(file);
    });
  }

  getFileContent(fileId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/${fileId}`, {
      responseType: 'text'
    });
  }
}
