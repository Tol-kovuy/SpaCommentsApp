import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LocalizationPipe,
  LocalizationService 
} from '@abp/ng.core';
import { CommentService } from '../services/comment.service';
import { CreateUpdateCommentDto } from '../models/comment';
import { CaptchaComponent } from '../captcha/captcha.component';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LocalizationPipe,
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
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formData = this.commentForm.value;

      const commentData: CreateUpdateCommentDto = {
        userName: formData.userName,
        email: formData.email,
        homepage: formData.homepage || undefined,
        text: formData.text,
        captcha: formData.captcha
      };

      const result = await this.commentService.createComment(commentData).toPromise();

      this.commentForm.reset();
      this.commentAdded.emit();
      this.showPreview = false;

    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.commentForm.patchValue({ file: file });

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
