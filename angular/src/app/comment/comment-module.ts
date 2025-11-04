// src/app/comment/comment.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CommentListComponent } from './comment-list/comment-list';
import { CommentFormComponent } from './comment-form/comment-form';
import { CommentPreviewComponent } from './comment-preview/comment-preview';
import { CaptchaComponent } from './captcha/captcha';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: CommentListComponent }
    ]),
    CommentListComponent,
    CommentFormComponent,
    CommentPreviewComponent,
    CaptchaComponent
  ]
})
export class CommentModule { }
