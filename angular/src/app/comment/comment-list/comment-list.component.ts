import { Component, OnInit } from '@angular/core';
import { CommentService } from '../services/comment.service';
import { CommentDto } from '../models/comment'; // Используем CommentDto вместо Comment
import { CommonModule } from '@angular/common';
import { CommentFormComponent } from '../comment-form/comment-form.component';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [
    CommonModule,
    CommentFormComponent,
  ],
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  comments: CommentDto[] = []; // Используем CommentDto вместо Comment
  totalCount = 0;
  pageSize = 25;
  currentPage = 1;
  sorting = 'creationTime desc';

  constructor(private commentService: CommentService) { }

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    const skipCount = (this.currentPage - 1) * this.pageSize;
    this.commentService.getComments(skipCount, this.pageSize, this.sorting)
      .subscribe(response => {
        this.comments = response.items;
        this.totalCount = response.totalCount;
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadComments();
  }

  onSortChange(sortField: string): void {
    if (this.sorting.includes(sortField)) {
      this.sorting = this.sorting.includes('desc')
        ? `${sortField} asc`
        : `${sortField} desc`;
    } else {
      this.sorting = `${sortField} desc`;
    }
    this.loadComments();
  }

  getSortIcon(field: string): string {
    if (!this.sorting.includes(field)) return '';
    return this.sorting.includes('desc') ? '↓' : '↑';
  }

  getPages(): number[] {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  onReplyAdded(): void {
    this.loadComments();
  }

  showReplyForm(commentId: string): void {
    // Логика для показа формы ответа
    console.log('Reply to comment:', commentId);
  }
}
