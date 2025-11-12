// src/app/comment/comment-preview/comment-preview.component.ts
import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateUpdateCommentDto } from '../models/comment';

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
}
