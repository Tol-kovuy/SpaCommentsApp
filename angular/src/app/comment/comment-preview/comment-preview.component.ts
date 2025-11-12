import { Component, Input, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateUpdateCommentDto } from '../models/comment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-comment-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comment-preview.component.html',
  styleUrls: ['./comment-preview.component.scss']
})
export class CommentPreviewComponent implements OnChanges, OnDestroy {
  @Input() commentData!: CreateUpdateCommentDto;
  @Input() selectedFile: File | null = null;

  filePreviewUrl: string | null = null;
  private sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedFile'] && this.selectedFile) {
      this.createFilePreview();
    }
  }

  ngOnDestroy(): void {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
    }
  }

  createFilePreview(): void {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
      this.filePreviewUrl = null;
    }

    if (this.selectedFile && this.isImageFile()) {
      this.filePreviewUrl = URL.createObjectURL(this.selectedFile);
    }
  }

  isImageFile(): boolean {
    return this.selectedFile ? this.selectedFile.type.startsWith('image/') : false;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  sanitizeHtml(html: string): SafeHtml {
    if (!html) return 'No text provided yet...';

    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/javascript:/gi, '')
      .replace(/<!\[CDATA\[.*?\]\]>/g, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<!ENTITY[^>]*>/gi, '');

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
