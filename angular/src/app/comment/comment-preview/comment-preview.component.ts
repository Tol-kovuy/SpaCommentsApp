import { Component, Input } from '@angular/core';
import { CreateComment } from '../models/comment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comment-preview',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './comment-preview.component.html',
  styleUrls: ['./comment-preview.component.scss']
})
export class CommentPreviewComponent {
  @Input() commentData!: CreateComment;
}
