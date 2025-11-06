import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommentDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private cdRef: ChangeDetectorRef) { }

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

  trackByCommentId(index: number, comment: CommentDto): string {
    return comment.id;
  }
}
