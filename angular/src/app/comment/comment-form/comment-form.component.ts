import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommentService } from '../services/comment.service';
import { CreateUpdateCommentDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { LocalizationPipe } from '@abp/ng.core'; 

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LocalizationPipe 
  ],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss']
})
export class CommentFormComponent {
  @Output() commentAdded = new EventEmitter<void>();

  commentForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  showPreview = false;
  fileName = ''

  constructor(
    private fb: FormBuilder,
    private commentService: CommentService
  ) {
    this.commentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      homepage: [''],
      text: ['', [Validators.required, Validators.minLength(5)]],
      captcha: ['test']
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name; 
    }
  }

  async onSubmit(): Promise<void> {
    if (this.commentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formData: CreateUpdateCommentDto = {
          userName: this.commentForm.value.userName,
          email: this.commentForm.value.email,
          homepage: this.commentForm.value.homepage || '',
          text: this.commentForm.value.text,
          captcha: 'test'
        };

        // TODO: Добавить логику загрузки файла когда будет готов бэкенд
        // if (this.selectedFile) {
        //   // Загрузка файла
        // }

        await this.commentService.createComment(formData).toPromise();

        this.commentAdded.emit();
        this.commentForm.reset();
        this.selectedFile = null; 

      } catch (error) {
        console.error('Error creating comment:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }
}
