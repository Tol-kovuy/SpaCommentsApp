import { Component, Output, EventEmitter, inject, OnDestroy, ViewChild, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommentService } from '../services/comment.service';
import { CreateUpdateCommentDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { FileService, TextFileUploadResult, FileUploadResult } from '../../services/file.service';
import { LightboxService } from '../../services/lightbox.service';
import { firstValueFrom } from 'rxjs';
import { CaptchaComponent } from '../captcha/captcha.component';
import { CommentPreviewComponent } from '../comment-preview/comment-preview.component';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CaptchaComponent,
    CommentPreviewComponent
  ],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss']
})
export class CommentFormComponent implements OnDestroy {
  @Output() commentAdded = new EventEmitter<void>();
  @ViewChild(CaptchaComponent) captchaComp: CaptchaComponent;

  @Input() parentId?: string; 
  @Input() isReply: boolean = false;

  private fileService = inject(FileService);
  private lightboxService = inject(LightboxService);
  private commentService = inject(CommentService);

  commentForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  uploadedFileId: string | null = null;
  showPreview = false;
  filePreview: string | null = null;
  isUploading = false;
  fileError: string = '';
  captchaId: string | null = null;
  captchaServerError: string | null = null;

  constructor(
    private fb: FormBuilder
  ) {
    const captchaValidators = this.isReply ? [] : [Validators.required];

    this.commentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      homepage: [''],
      text: ['', [Validators.required, Validators.minLength(5)]],
      captcha: ['', captchaValidators]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log('📁 File selected:', file);
    if (!file) return;

    this.selectedFile = file;
    this.uploadedFileId = null;
    this.fileError = '';

    console.log('📊 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (file.type.startsWith('image/')) {
      const validation = this.fileService.validateImage(file);
      if (!validation.isValid) {
        this.fileError = validation.error || 'Invalid image file';
        this.clearFile();
        return;
      }
      this.filePreview = this.fileService.createObjectURL(file);
    } else if (file.name.toLowerCase().endsWith('.txt')) {
      const validation = this.fileService.validateTextFile(file);
      if (!validation.isValid) {
        this.fileError = validation.error || 'Invalid text file';
        this.clearFile();
        return;
      }
      this.filePreview = null;
    } else {
      this.fileError = 'Unsupported file type. Please select an image (JPG, PNG, GIF) or text file (TXT).';
      this.clearFile();
      return;
    }
  }

  previewFile(): void {
    if (!this.selectedFile) return;

    if (this.selectedFile.type.startsWith('image/') && this.filePreview) {
      this.lightboxService.open([
        this.lightboxService.createImageItem(this.filePreview, this.selectedFile.name)
      ]);
    } else if (this.selectedFile.name.toLowerCase().endsWith('.txt')) {
      this.fileService.readTextFile(this.selectedFile).subscribe({
        next: (content) => {
          this.lightboxService.open([
            this.lightboxService.createTextItem(content, this.selectedFile!.name, this.selectedFile!.size)
          ]);
        },
        error: (error) => {
          console.error('Error reading text file:', error);
          this.fileError = 'Error reading text file';
        }
      });
    }
  }

  clearFile(): void {
    if (this.filePreview) {
      this.fileService.revokeObjectURL(this.filePreview);
    }
    this.selectedFile = null;
    this.uploadedFileId = null;
    this.filePreview = null;
    this.fileError = '';

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onCaptchaChanged(event: { captchaId: string | null }) {
    this.captchaId = event.captchaId;
    this.captchaServerError = null;
    this.commentForm.get('captcha')?.reset();
  }

  async onSubmit(): Promise<void> {
    console.log('SUBMISSION START - Is Reply:', this.isReply);

    if (this.commentForm.valid && !this.isSubmitting) {
      console.log('Form is valid, proceeding...');

      this.isSubmitting = true;
      this.fileError = '';
      this.captchaServerError = '';

      try {
        const formValue = this.commentForm.value;
        let fileId: string | null = null;

        if (!this.isReply) {
          if (!this.captchaId) {
            this.captchaServerError = 'CAPTCHA not loaded. Please refresh the page.';
            this.isSubmitting = false;
            return;
          }
        }

        if (this.selectedFile) {
          console.log('File detected, uploading first...');
          fileId = await this.uploadFileWithPromise(this.selectedFile);
          console.log('File uploaded successfully, fileId:', fileId);
        }

        console.log('Creating comment with fileId:', fileId);

        const createCommentDto: CreateUpdateCommentDto = {
          userName: formValue.userName,
          email: formValue.email,
          homepage: formValue.homepage || '',
          text: formValue.text,
          captcha: this.isReply ? 'not-required-for-replies' : formValue.captcha, 
          captchaId: this.isReply ? 'not-required-for-replies' : this.captchaId,
          fileId: fileId || undefined,
          parentId: this.parentId
        };

        console.log('🔍 Final DTO for comment creation:', createCommentDto);

        const result = await firstValueFrom(this.commentService.createComment(createCommentDto));
        console.log('Comment created successfully:', result);

        this.onSuccess();

      } catch (error: any) {
        console.error('Submission error:', error);
        if (error.error && (error.error.error === 'Invalid captcha' || error.error?.message?.includes('captcha'))) {
          this.captchaServerError = 'CAPTCHA invalid, try again!';
          this.captchaComp?.loadCaptcha();
          this.commentForm.get('captcha')?.reset();
        } else {
          this.onError(error);
        }
      } finally {
        this.isSubmitting = false;
      }
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched();
    }
  }

  private async uploadFileWithPromise(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Starting file upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      let uploadObservable;

      if (file.type.startsWith('image/')) {
        uploadObservable = this.fileService.uploadImage(file);
      } else {
        uploadObservable = this.fileService.uploadTextFile(file);
      }

      uploadObservable.subscribe({
        next: (result: any) => {
          console.log('File uploaded successfully:', result);

          const fileId = result.id;
          if (fileId) {
            console.log('File ID found:', fileId);
            resolve(fileId);
          } else {
            console.error('File ID not found in response');
            reject(new Error('File ID not found in response'));
          }
        },
        error: (error) => {
          console.error('File upload failed:', error);

          let errorMessage = 'File upload failed';
          if (error.status === 400) {
            errorMessage = 'Server validation failed. Check file format and size.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. Please check permissions.';
          } else if (error.status === 413) {
            errorMessage = 'File too large';
          }

          reject(new Error(errorMessage));
        }
      });
    });
  }

  private onSuccess(): void {
    this.commentAdded.emit();
    this.resetForm();
  }

  private onError(error: any): void {
    console.error('Submission error details:', error);

    if (error.error?.validationErrors) {
      error.error.validationErrors.forEach((valError: any) => {
        this.fileError = valError.message || 'Validation error';
      });
    } else if (error.status === 400) {
      this.fileError = 'Invalid data. Please check your inputs.';
    } else if (error.status === 403) {
      this.fileError = 'Permission denied.';
    } else {
      this.fileError = error.message || 'Error submitting comment. Please try again.';
    }
  }

  private resetForm(): void {
    this.commentForm.reset({
      userName: '',
      email: '',
      homepage: '',
      text: '',
      captcha: ''
    });
    this.clearFile();
    this.showPreview = false;
    this.fileError = '';
    this.captchaComp?.loadCaptcha();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.commentForm.controls).forEach(key => {
      const control = this.commentForm.get(key);
      control?.markAsTouched();
    });
  }

  get userName() { return this.commentForm.get('userName'); }
  get email() { return this.commentForm.get('email'); }
  get homepage() { return this.commentForm.get('homepage'); }
  get text() { return this.commentForm.get('text'); }
  get captcha() { return this.commentForm.get('captcha'); }

  ngOnDestroy(): void {
    if (this.filePreview) {
      this.fileService.revokeObjectURL(this.filePreview);
    }
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  canSubmit(): boolean {
    if (this.isReply) {
      return this.commentForm.valid && !this.isSubmitting;
    } else {
      return this.commentForm.valid && !this.isSubmitting && !!this.captchaId;
    }
  }

  get previewData(): CreateUpdateCommentDto {
    const formValue = this.commentForm.value;

    return {
      userName: formValue.userName || '',
      email: formValue.email || '',
      homepage: formValue.homepage || '',
      text: formValue.text || '',
      captcha: this.isReply ? 'not-required-for-replies' : formValue.captcha || '',
      captchaId: this.isReply ? 'not-required-for-replies' : this.captchaId || '',
      fileId: this.uploadedFileId || undefined,
      parentId: this.parentId
    };
  }
}
