import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaptchaComponent } from '../captcha/captcha.component';
import { CommentService } from '../services/comment.service';
import { CreateUpdateCommentDto } from '../models/comment';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CaptchaComponent
  ],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss']
})
export class CommentFormComponent implements OnInit {
  @Output() commentAdded = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef;

  commentForm!: FormGroup;
  showPreview = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private commentService: CommentService
  ) { }

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      homepage: ['', [Validators.pattern(/https?:\/\/.+/)]],
      text: ['', [Validators.required]],
      captcha: ['', [Validators.required]],
      file: [null]
    });

    // Управление disabled состоянием
    this.commentForm.statusChanges.subscribe(() => {
      Object.keys(this.commentForm.controls).forEach(key => {
        const control = this.commentForm.get(key);
        if (this.isSubmitting && control?.enabled) {
          control.disable();
        } else if (!this.isSubmitting && control?.disabled) {
          control.enable();
        }
      });
    });
  }

  async onSubmit(): Promise<void> {
    if (this.commentForm.invalid) {
      console.log('Form invalid:', this.commentForm.errors);
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formData = this.commentForm.value;
      console.log('Form data:', formData);

      // Создаем объект для отправки
      const commentData: CreateUpdateCommentDto = {
        userName: formData.userName,
        email: formData.email,
        homepage: formData.homepage || undefined,
        text: formData.text,
        captcha: formData.captcha
      };

      console.log('Sending to API:', commentData);

      // Отправляем комментарий в БД
      const result = await this.commentService.createComment(commentData).toPromise();
      console.log('API Response:', result);

      // Сбрасываем форму и эмитим событие
      this.commentForm.reset();
      this.commentAdded.emit();
      this.showPreview = false;

      console.log('Comment created successfully');

    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      this.commentForm.patchValue({ file: file });

      // Показываем имя файла
      const fileNameElement = document.getElementById('fileName');
      if (fileNameElement) {
        fileNameElement.textContent = file.name;
      }
    }
  }

  togglePreview(): void {
    if (this.commentForm.valid) {
      this.showPreview = !this.showPreview;
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.commentForm.controls).forEach(key => {
      const control = this.commentForm.get(key);
      control?.markAsTouched();
    });
  }
}
