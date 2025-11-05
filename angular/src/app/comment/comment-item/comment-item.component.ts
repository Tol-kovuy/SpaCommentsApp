import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommentDto, CreateUpdateCommentDto } from '../models/comment';
import { CommentService } from '../services/comment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentItemComponent],
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent {
  @Input() comment!: CommentDto;
  @Input() level: number = 0;
  @Output() commentAdded = new EventEmitter<void>();

  showReplyForm = false;
  replyText: string = '';
  replyUserName: string = '';

  constructor(private commentService: CommentService) { }

  toggleReplyForm(): void {
    this.showReplyForm = !this.showReplyForm;
    if (this.showReplyForm) {
      this.replyText = '';
      this.replyUserName = '';
    }
  }

  submitReply(): void {
    if (!this.replyText.trim()) return;

    const replyDto: CreateUpdateCommentDto = {
      userName: this.replyUserName.trim() || 'Anonymous',
      email: '',
      homepage: '',
      text: this.replyText.trim(),
      captcha: 'test',
      parentId: this.comment.id
    };

    this.commentService.createComment(replyDto).subscribe({
      next: () => {
        this.showReplyForm = false;
        this.replyText = '';
        this.replyUserName = '';
        this.commentAdded.emit();
      },
      error: (error) => {
        console.error('Error submitting reply:', error);
      }
    });
  }

  getMarginLeft(): string {
    return `${this.level * 30}px`;
  }

  hasReplies(): boolean {
    return this.comment.replies && this.comment.replies.length > 0;
  }
}
