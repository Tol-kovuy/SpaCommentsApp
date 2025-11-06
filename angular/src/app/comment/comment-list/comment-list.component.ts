import { Component, OnInit } from '@angular/core';
import { CommentService } from '../services/comment.service';
import { CommentDto, CreateUpdateCommentDto, CommentGetListDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { FormsModule } from '@angular/forms';

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

  constructor(private commentService: CommentService) { }

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

    this.commentService.getComments(input).subscribe(response => {
      this.comments = response.items || [];
      this.totalCount = response.totalCount || 0;
    });
  }

  loadReplies(comment: CommentDto): void {
    if (comment.repliesLoaded) return;

    this.commentService.getReplies(comment.id, 0, 10, 'creationTime asc')
      .subscribe(response => {
        const realReplies = (response.items || []).filter(reply => !reply.id.startsWith('temp-'));
        comment.replies = realReplies;
        comment.repliesLoaded = true;
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
    const replyDto: CreateUpdateCommentDto = {
      userName: event.userName.trim() || 'Anonymous',
      email: '',
      homepage: '',
      text: event.text.trim(),
      parentId: event.parentCommentId
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
}
