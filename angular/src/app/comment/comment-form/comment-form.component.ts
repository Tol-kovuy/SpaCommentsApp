import { Component, Output, EventEmitter, inject, OnDestroy, ViewChild, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommentService } from '../services/comment.service';
import { CreateUpdateCommentDto } from '../models/comment';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { LightboxService } from '../../services/lightbox.service';
import { firstValueFrom } from 'rxjs';
import { CaptchaComponent } from '../captcha/captcha.component';
import { CommentPreviewComponent } from '../comment-preview/comment-preview.component';
import { HtmlValidatorService } from '../services/html-validator.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  private htmlValidator = inject(HtmlValidatorService);
  private sanitizer = inject(DomSanitizer);

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

  showHtmlPanel = false;
  htmlValidationErrors: string[] = [];
  showHtmlValidation = false;
  htmlButtons = [
    { tag: 'i', icon: 'I', title: 'Italic' },
    { tag: 'strong', icon: 'B', title: 'Bold' },
    { tag: 'code', icon: '</>', title: 'Code' },
    { tag: 'a', icon: '🔗', title: 'Link' }
  ];

  constructor(private fb: FormBuilder) {
    const captchaValidators = this.isReply ? [] : [Validators.required];

    this.commentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      homepage: [''],
      text: ['', [Validators.required, Validators.minLength(5)]],
      captcha: ['', captchaValidators]
    });

    // Валидация HTML при изменении текста
    this.commentForm.get('text')?.valueChanges.subscribe(() => {
      setTimeout(() => this.validateHtml(), 300);
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    this.uploadedFileId = null;
    this.fileError = '';

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
    if (this.commentForm.valid && !this.isSubmitting && this.isHtmlValid()) {
      this.isSubmitting = true;
      this.fileError = '';
      this.captchaServerError = '';

      try {
        const formValue = this.commentForm.value;
        let fileId: string | null = null;

        if (!this.isReply && !this.captchaId) {
          this.captchaServerError = 'CAPTCHA not loaded. Please refresh the page.';
          this.isSubmitting = false;
          return;
        }

        if (this.selectedFile) {
          fileId = await this.uploadFileWithPromise(this.selectedFile);
        }

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

        const result = await firstValueFrom(this.commentService.createComment(createCommentDto));
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
      this.markFormGroupTouched();
      if (!this.isHtmlValid()) {
        this.showHtmlValidation = true;
      }
    }
  }

  private async uploadFileWithPromise(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      let uploadObservable;

      if (file.type.startsWith('image/')) {
        uploadObservable = this.fileService.uploadImage(file);
      } else {
        uploadObservable = this.fileService.uploadTextFile(file);
      }

      // Используем any для обхода проблем с типами
      (uploadObservable as any).subscribe({
        next: (result: any) => {
          console.log('File uploaded successfully:', result);

          // Разные варианты получения fileId в зависимости от типа ответа
          let fileId: string | null = null;

          if (result.id) {
            fileId = result.id;
          } else if (result.fileId) {
            fileId = result.fileId;
          } else if (result.data?.id) {
            fileId = result.data.id;
          } else if (typeof result === 'string') {
            fileId = result;
          }

          if (fileId) {
            console.log('File ID found:', fileId);
            resolve(fileId);
          } else {
            console.error('File ID not found in response:', result);
            reject(new Error('File ID not found in response'));
          }
        },
        error: (error: any) => {
          console.error('File upload failed:', error);

          let errorMessage = 'File upload failed';
          if (error.status === 400) {
            errorMessage = 'Server validation failed. Check file format and size.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. Please check permissions.';
          } else if (error.status === 413) {
            errorMessage = 'File too large';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
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
    this.htmlValidationErrors = [];
    this.showHtmlValidation = false;
    this.captchaComp?.loadCaptcha();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.commentForm.controls).forEach(key => {
      const control = this.commentForm.get(key);
      control?.markAsTouched();
    });
  }

  // HTML Validation Methods
  validateHtml(): void {
    const text = this.commentForm.get('text')?.value || '';
    const validation = this.htmlValidator.validateXHTML(text);
    this.htmlValidationErrors = validation.errors;
    this.showHtmlValidation = this.htmlValidationErrors.length > 0;
  }

  autoFixHtml(): void {
    const text = this.commentForm.get('text')?.value || '';
    const fixedText = this.htmlValidator.autoFixXHTML(text);
    this.commentForm.get('text')?.setValue(fixedText);
    this.validateHtml();
  }

  isHtmlValid(): boolean {
    return this.htmlValidationErrors.length === 0;
  }

  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';

    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/javascript:/gi, '')
      .replace(/<!\[CDATA\[.*?\]\]>/g, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<!ENTITY[^>]*>/gi, '');

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  insertHtmlTag(tag: string): void {
    const textarea = document.querySelector('#commentText') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (tag) {
      case 'i':
        newText = `<i>${selectedText}</i>`;
        cursorOffset = selectedText ? 3 + selectedText.length : 3;
        break;
      case 'strong':
        newText = `<strong>${selectedText}</strong>`;
        cursorOffset = selectedText ? 8 + selectedText.length : 8;
        break;
      case 'code':
        newText = `<code>${selectedText}</code>`;
        cursorOffset = selectedText ? 7 + selectedText.length : 7;
        break;
      case 'a':
        const url = prompt('Enter URL:', 'https://');
        if (!url) return;
        const linkText = selectedText || 'link';
        newText = `<a href="${url}">${linkText}</a>`;
        cursorOffset = newText.length;
        break;
    }

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + newText + after;

    this.commentForm.get('text')?.setValue(textarea.value);
    this.validateHtml();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }

  insertLink(): void {
    const url = prompt('Enter URL:', 'https://');
    if (!url) return;

    const textarea = document.querySelector('#commentText') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const linkText = selectedText || 'link';

    const newText = `<a href="${url}">${linkText}</a>`;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + newText + after;

    this.commentForm.get('text')?.setValue(textarea.value);
    this.validateHtml();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  }

  toggleHtmlPanel(): void {
    this.showHtmlPanel = !this.showHtmlPanel;
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  canSubmit(): boolean {
    if (this.isReply) {
      return this.commentForm.valid && !this.isSubmitting && this.isHtmlValid();
    } else {
      return this.commentForm.valid && !this.isSubmitting && !!this.captchaId && this.isHtmlValid();
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
}
