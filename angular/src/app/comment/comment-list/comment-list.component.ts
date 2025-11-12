import { Component, OnInit } from '@angular/core';
import { CommentService } from '../services/comment.service';
import { CommentDto, CreateUpdateCommentDto, CommentGetListDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../services/file.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [
    CommonModule,
    CommentFormComponent,
    CommentItemComponent,
    FormsModule
  ],
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  comments: CommentDto[] = [];
  totalCount = 0;
  pageSize = 25;
  currentPage = 1;
  sorting = 'creationTime desc';
  filter = '';

  expandedComments: Set<string> = new Set();
  showReplyFormFor: string | null = null;
  replyTexts: Map<string, string> = new Map();
  replyUserNames: Map<string, string> = new Map();
  private tempReplyCounter = 0;

  imageCache: Map<string, SafeUrl> = new Map();
  loadingImages: Set<string> = new Set();

  constructor(
    private commentService: CommentService,
    private fileService: FileService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadParentComments();
  }

  loadParentComments(): void {
    const skipCount = (this.currentPage - 1) * this.pageSize;

    const input: CommentGetListDto = {
      skipCount: skipCount,
      maxResultCount: this.pageSize,
      sorting: this.sorting,
      filter: this.filter,
      parentId: null
    };

    console.log('Loading parent comments...');

    this.commentService.getComments(input).subscribe(response => {
      console.log('COMMENTS RESPONSE:', response);

      response.items?.forEach((comment, index) => {
        console.log(`Comment ${index}:`, {
          id: comment.id,
          userName: comment.userName,
          text: comment.text,
          fileId: comment.fileId,
          fileName: comment.fileName,
          fileType: comment.fileType,
          fileSize: comment.fileSize,
          previewUrl: comment.previewUrl
        });

        if (this.isImageFile(comment) && comment.fileId) {
          this.preloadImage(comment);
        }
      });

      this.comments = response.items || [];
      this.totalCount = response.totalCount || 0;
    });
  }

  private preloadImage(comment: CommentDto): void {
    if (!comment.fileId || this.imageCache.has(comment.fileId) || this.loadingImages.has(comment.fileId)) {
      return;
    }

    this.loadingImages.add(comment.fileId);

    this.fileService.getFileContent(comment.fileId).subscribe({
      next: (fileContent) => {
        let imageData: string;

        if (this.isJson(fileContent)) {
          try {
            const fileData = JSON.parse(fileContent);
            if (fileData.content) {
              // base64
              const binaryString = atob(fileData.content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: comment.fileType === 'image' ? 'image/jpeg' : 'application/octet-stream' });
              imageData = URL.createObjectURL(blob);
            } else {
              imageData = this.createImageUrl(fileContent, comment);
            }
          } catch (error) {
            console.error('Error parsing image JSON:', error);
            imageData = this.createImageUrl(fileContent, comment);
          }
        } else {
          imageData = this.createImageUrl(fileContent, comment);
        }

        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(imageData);
        this.imageCache.set(comment.fileId!, safeUrl);
        this.loadingImages.delete(comment.fileId);
      },
      error: (error) => {
        console.error('Error preloading image:', error);
        this.loadingImages.delete(comment.fileId);
      }
    });
  }

  private createImageUrl(content: any, comment: CommentDto): string {
    if (typeof content === 'string' && content.startsWith('data:')) {
      return content;
    } else if (typeof content === 'string') {
      return 'data:image/jpeg;base64,' + content;
    } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
      const blob = new Blob([content], { type: comment.fileType === 'image' ? 'image/jpeg' : 'application/octet-stream' });
      return URL.createObjectURL(blob);
    } else {
      const blob = new Blob([JSON.stringify(content)], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    }
  }

  getImageUrl(comment: CommentDto): SafeUrl | null {
    if (!comment.fileId) return null;
    return this.imageCache.get(comment.fileId) || null;
  }

  isImageLoading(comment: CommentDto): boolean {
    return comment.fileId ? this.loadingImages.has(comment.fileId) : false;
  }

  showImagePreview(comment: CommentDto, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!comment.fileId || comment.fileType !== 'image') return;

    const imageUrl = this.getImageUrl(comment);
    if (imageUrl) {
      this.showImageModal(comment.fileName || 'image', imageUrl.toString());
    } else {
      this.loadingImages.add(comment.fileId);

      this.fileService.getFileContent(comment.fileId).subscribe({
        next: (content) => {
          try {
            let imageData: string;

            if (this.isJson(content)) {
              const fileData = JSON.parse(content);
              if (fileData.content) {
                imageData = 'data:image/jpeg;base64,' + fileData.content;
              } else {
                const blob = new Blob([content], { type: 'image/jpeg' });
                imageData = URL.createObjectURL(blob);
              }
            } else {
              const blob = new Blob([content], { type: 'image/jpeg' });
              imageData = URL.createObjectURL(blob);
            }

            const safeUrl = this.sanitizer.bypassSecurityTrustUrl(imageData);
            this.imageCache.set(comment.fileId!, safeUrl);

            this.showImageModal(comment.fileName || 'image', imageData);

          } catch (error) {
            console.error('❌ Error processing image:', error);
            alert('Error loading image');
          } finally {
            this.loadingImages.delete(comment.fileId);
          }
        },
        error: (error) => {
          console.error('❌ Error loading image:', error);
          this.loadingImages.delete(comment.fileId);
          alert('Error loading image');
        }
      });
    }
  }

  private showImageModal(fileName: string, imageUrl: string): void {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const contentDiv = document.createElement('div');
    contentDiv.style.backgroundColor = 'white';
    contentDiv.style.padding = '20px';
    contentDiv.style.borderRadius = '8px';
    contentDiv.style.maxWidth = '90%';
    contentDiv.style.maxHeight = '90%';
    contentDiv.style.overflow = 'auto';
    contentDiv.style.position = 'relative';
    contentDiv.style.textAlign = 'center';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.zIndex = '1001';

    const fileNameElement = document.createElement('h3');
    fileNameElement.textContent = `Image: ${fileName}`;
    fileNameElement.style.marginBottom = '15px';

    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.style.maxWidth = '100%';
    imageElement.style.maxHeight = '70vh';
    imageElement.style.objectFit = 'contain';
    imageElement.style.borderRadius = '4px';

    closeBtn.onclick = () => {
      document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

    contentDiv.appendChild(closeBtn);
    contentDiv.appendChild(fileNameElement);
    contentDiv.appendChild(imageElement);
    modal.appendChild(contentDiv);
    document.body.appendChild(modal);
  }

  isImageFile(comment: CommentDto): boolean {
    return comment.fileType === 'image';
  }

  isTextFile(comment: CommentDto): boolean {
    return comment.fileType === 'text';
  }

  loadReplies(comment: CommentDto): void {
    if (comment.repliesLoaded) return;

    this.commentService.getReplies(comment.id, 0, 25, 'creationTime asc')
      .subscribe({
        next: (response) => {
          comment.replies = response.items || [];
          comment.repliesLoaded = true;
          comment.hasReplies = comment.replies.length > 0;
        },
        error: (error) => {
          console.error('Error loading replies:', error);
        }
      });
  }

  loadMoreReplies(comment: CommentDto): void {
    const skipCount = comment.replies ? comment.replies.filter(reply => !reply.id.startsWith('temp-')).length : 0;

    this.commentService.getReplies(comment.id, skipCount, 10, 'creationTime asc')
      .subscribe(response => {
        const realReplies = response.items || [];
        const existingTempReplies = comment.replies ? comment.replies.filter(reply => reply.id.startsWith('temp-')) : [];
        comment.replies = [...existingTempReplies, ...realReplies];
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadParentComments();
  }

  onSortChange(sortField: string): void {
    if (this.sorting.includes(sortField)) {
      this.sorting = this.sorting.includes('desc')
        ? `${sortField} asc`
        : `${sortField} desc`;
    } else {
      this.sorting = `${sortField} desc`;
    }
    this.currentPage = 1;
    this.loadParentComments();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadParentComments();
  }

  getSortIcon(field: string): string {
    if (!this.sorting.includes(field)) return '';
    return this.sorting.includes('desc') ? '↓' : '↑';
  }

  getPages(): number[] {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  onCommentAdded(): void {
    this.loadParentComments();
  }

  toggleCommentDetails(commentId: string): void {
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
      const comment = this.findCommentById(this.comments, commentId);
      if (comment && !comment.repliesLoaded) {
        this.loadReplies(comment);
      }
    }
  }

  isExpanded(commentId: string): boolean {
    return this.expandedComments.has(commentId);
  }

  onShowReplyForm(commentId: string): void {
    this.showReplyFormFor = this.showReplyFormFor === commentId ? null : commentId;

    if (!this.replyTexts.has(commentId)) {
      this.replyTexts.set(commentId, '');
      this.replyUserNames.set(commentId, '');
    }
  }

  onSetReplyText(event: { id: string, text: string }): void {
    this.replyTexts.set(event.id, event.text);
  }

  onSetReplyUserName(event: { id: string, userName: string }): void {
    this.replyUserNames.set(event.id, event.userName);
  }

  onSubmitReply(event: { parentCommentId: string, text: string, userName: string }): void {
    // ВРЕМЕННОЕ РЕШЕНИЕ - используем временные значения для капчи
    // В реальном приложении нужно добавить капчу в форму ответов
    const replyDto: CreateUpdateCommentDto = {
      userName: event.userName.trim() || 'Anonymous',
      email: '',
      homepage: '',
      text: event.text.trim(),
      parentId: event.parentCommentId,
      captchaId: 'temp-reply-captcha-id', // временное значение
      captcha: 'temp-reply-captcha'       // временное значение
    };

    this.tempReplyCounter++;
    const tempId = `temp-${Date.now()}-${this.tempReplyCounter}`;

    const tempReply: CommentDto = {
      id: tempId,
      parentId: event.parentCommentId,
      userName: event.userName.trim() || 'Anonymous',
      email: '',
      homepage: '',
      text: event.text.trim(),
      creationTime: new Date().toISOString(),
      replies: [],
      repliesLoaded: true,
      repliesCount: 0,
      hasReplies: false
    };

    this.addTempReply(event.parentCommentId, tempReply, tempId);

    this.commentService.createComment(replyDto).subscribe({
      next: (newReply) => {
        this.replaceTempReply(event.parentCommentId, tempId, newReply);

        this.showReplyFormFor = null;
        this.replyTexts.delete(event.parentCommentId);
        this.replyUserNames.delete(event.parentCommentId);
      },
      error: (error) => {
        this.removeTempReply(event.parentCommentId, tempId);
        console.error('Error submitting reply:', error);
      }
    });
  }

  onCancelReply(commentId: string): void {
    this.showReplyFormFor = null;
    this.replyTexts.delete(commentId);
    this.replyUserNames.delete(commentId);
  }

  onLoadReplies(comment: CommentDto): void {
    if (!comment.repliesLoaded) {
      this.loadReplies(comment);
    }
  }

  isReplyingTo(commentId: string): boolean {
    return this.showReplyFormFor === commentId;
  }

  private addTempReply(parentCommentId: string, tempReply: CommentDto, tempId: string): void {
    const parentComment = this.findCommentById(this.comments, parentCommentId);
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = [];
      }

      const existingTempIndex = parentComment.replies.findIndex(reply => reply.id === tempId);
      if (existingTempIndex === -1) {
        parentComment.replies = [tempReply, ...parentComment.replies];
        parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
        parentComment.hasReplies = true;

        if (!parentComment.repliesLoaded) {
          parentComment.repliesLoaded = true;
        }
      }

      if (!this.isExpanded(parentCommentId)) {
        this.expandedComments.add(parentCommentId);
      }
    }
  }

  private replaceTempReply(parentCommentId: string, tempId: string, realComment: CommentDto): void {
    const parentComment = this.findCommentById(this.comments, parentCommentId);
    if (parentComment && parentComment.replies) {
      const tempIndex = parentComment.replies.findIndex(reply => reply.id === tempId);
      if (tempIndex !== -1) {
        parentComment.replies[tempIndex] = realComment;
      } else {
        parentComment.replies = [realComment, ...parentComment.replies.filter(reply => !reply.id.startsWith('temp-'))];
        parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
        parentComment.hasReplies = true;
      }
    }
  }

  private removeTempReply(parentCommentId: string, tempId: string): void {
    const parentComment = this.findCommentById(this.comments, parentCommentId);
    if (parentComment && parentComment.replies) {
      const tempIndex = parentComment.replies.findIndex(reply => reply.id === tempId);
      if (tempIndex !== -1) {
        parentComment.replies.splice(tempIndex, 1);
        parentComment.repliesCount = Math.max(0, (parentComment.repliesCount || 1) - 1);
        if (parentComment.replies.length === 0) {
          parentComment.hasReplies = false;
          parentComment.repliesLoaded = false;
        }
      }
    }
  }

  private findCommentById(comments: CommentDto[], id: string): CommentDto | null {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = this.findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  }

  trackByCommentId(index: number, comment: CommentDto): string {
    return comment.id;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  viewFile(comment: CommentDto, event: Event): void {
    event.stopPropagation();

    console.log('👁️ Viewing file for comment:', comment);

    if (!comment.fileId) return;

    if (comment.fileType === 'image') {
      const imageUrl = comment.previewUrl || `/api/app/file/${comment.fileId}`;
      window.open(imageUrl, '_blank');
    } else if (comment.fileType === 'text') {
      this.fileService.getFileContent(comment.fileId).subscribe({
        next: (content) => {
          console.log('File content loaded:', content);

          let contentToShow = content;

          if (this.isJson(content)) {
            try {
              const fileData = JSON.parse(content);
              if (fileData.content) {
                contentToShow = atob(fileData.content); // base64
                console.log('Decoded content:', contentToShow);
              }
            } catch (error) {
              console.error('Error parsing file JSON:', error);
              contentToShow = 'Error parsing file content';
            }
          }

          this.showTextModal(comment.fileName || 'text.txt', contentToShow);
        },
        error: (error) => {
          console.error('Error loading file:', error);
          alert('Error loading file content');
        }
      });
    }
  }

  private isJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  private showTextModal(fileName: string, content: string): void {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const contentDiv = document.createElement('div');
    contentDiv.style.backgroundColor = 'white';
    contentDiv.style.padding = '20px';
    contentDiv.style.borderRadius = '8px';
    contentDiv.style.maxWidth = '80%';
    contentDiv.style.maxHeight = '80%';
    contentDiv.style.overflow = 'auto';
    contentDiv.style.position = 'relative';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';

    const fileNameElement = document.createElement('h3');
    fileNameElement.textContent = `File: ${fileName}`;
    fileNameElement.style.marginBottom = '15px';

    const fileContent = document.createElement('pre');
    fileContent.textContent = content;
    fileContent.style.whiteSpace = 'pre-wrap';
    fileContent.style.wordWrap = 'break-word';
    fileContent.style.fontFamily = 'monospace';
    fileContent.style.background = '#f5f5f5';
    fileContent.style.padding = '15px';
    fileContent.style.borderRadius = '4px';
    fileContent.style.maxHeight = '400px';
    fileContent.style.overflow = 'auto';

    closeBtn.onclick = () => {
      document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

    contentDiv.appendChild(closeBtn);
    contentDiv.appendChild(fileNameElement);
    contentDiv.appendChild(fileContent);
    modal.appendChild(contentDiv);
    document.body.appendChild(modal);
  }

  hasFile(comment: CommentDto): boolean {
    return !!comment.fileId;
  }

  getFileType(comment: CommentDto): string {
    return comment.fileType || 'unknown';
  }

  getReplyFormComponent(commentId: string): any {
    // В реальном приложении здесь будет логика создания компонента формы ответа
    return CommentFormComponent;
  }
}
