import { Component, Input, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { CommentDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LightboxService } from '../../services/lightbox.service';
import { FileService } from '../../services/file.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent {
  @Input() comment!: CommentDto;
  @Input() level: number = 0;
  @Input() showReplyFormFor: string | null = null;
  @Input() replyTexts!: Map<string, string>;
  @Input() replyUserNames!: Map<string, string>;

  @Output() showReply = new EventEmitter<string>();
  @Output() setReplyText = new EventEmitter<{ id: string, text: string }>();
  @Output() setReplyUserName = new EventEmitter<{ id: string, userName: string }>();
  @Output() submitReply = new EventEmitter<{ parentCommentId: string, text: string, userName: string }>();
  @Output() cancelReply = new EventEmitter<string>();
  @Output() loadReplies = new EventEmitter<CommentDto>();

  private lightboxService = inject(LightboxService);
  private fileService = inject(FileService);
  private sanitizer = inject(DomSanitizer);

  constructor(private cdRef: ChangeDetectorRef) { }

  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';

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

  isReplyingTo(commentId: string): boolean {
    return this.showReplyFormFor === commentId;
  }

  getReplyText(commentId: string): string {
    return this.replyTexts.get(commentId) || '';
  }

  getReplyUserName(commentId: string): string {
    return this.replyUserNames.get(commentId) || '';
  }

  onSubmitReply(commentId: string): void {
    const text = this.getReplyText(commentId);
    const userName = this.getReplyUserName(commentId);

    console.log('CommentItemComponent: onSubmitReply', { commentId, text, userName });

    if (text?.trim()) {
      this.submitReply.emit({
        parentCommentId: commentId,
        text: text,
        userName: userName
      });
    } else {
      console.error('CommentItemComponent: Empty text submitted');
    }
  }

  onShowReplyForm(commentId: string): void {
    console.log('CommentItemComponent: onShowReplyForm', commentId);
    this.showReply.emit(commentId);
  }

  onSetReplyText(commentId: string, text: string): void {
    console.log('CommentItemComponent: onSetReplyText', { commentId, text });
    this.setReplyText.emit({ id: commentId, text });
  }

  onSetReplyUserName(commentId: string, userName: string): void {
    console.log('CommentItemComponent: onSetReplyUserName', { commentId, userName });
    this.setReplyUserName.emit({ id: commentId, userName });
  }

  onCancelReply(commentId: string): void {
    this.cancelReply.emit(commentId);
  }

  onLoadReplies(comment: CommentDto): void {
    if (!comment.repliesLoaded) {
      this.loadReplies.emit(comment);
    }
  }

  viewFile(comment: CommentDto): void {
    if (!comment.fileId) return;

    if (comment.fileType === 'image') {
      const imageUrl = comment.previewUrl || this.fileService.getFileUrl(comment.fileId);
      this.lightboxService.open([
        this.lightboxService.createImageItem(imageUrl, comment.fileName || 'Image')
      ]);
    } else if (comment.fileType === 'text') {
      this.fileService.getFile(comment.fileId).subscribe({
        next: (fileContent) => {
          let textContent = 'No content available';

          if (fileContent.content) {
            if (typeof fileContent.content === 'string') {
              textContent = fileContent.content;
            } else {
              try {
                textContent = JSON.stringify(fileContent.content);
              } catch {
                textContent = 'Binary content (cannot display)';
              }
            }
          }

          this.lightboxService.open([
            this.lightboxService.createTextItem(
              textContent,
              comment.fileName || 'Text File',
              comment.fileSize
            )
          ]);
        },
        error: (error) => {
          console.error('Error loading text file:', error);
          this.lightboxService.open([
            this.lightboxService.createTextItem(
              'Error loading file content',
              comment.fileName || 'Text File',
              comment.fileSize
            )
          ]);
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  hasFile(comment: CommentDto): boolean {
    return !!(comment.fileId || comment.fileName);
  }

  getFileType(comment: CommentDto): string {
    if (comment.fileType) return comment.fileType;
    if (comment.filePath) {
      const extension = comment.filePath.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '') ? 'image' : 'text';
    }
    return 'unknown';
  }

  trackByCommentId(index: number, comment: CommentDto): string {
    return comment.id;
  }
}
