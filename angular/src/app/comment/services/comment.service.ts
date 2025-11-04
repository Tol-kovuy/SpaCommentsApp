import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentDto, CreateUpdateCommentDto, CommentListResponse, CaptchaResponse } from '../models/comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  // Исправьте URL на бэкенд порт (скорее всего 44328 или 5000)
  private apiUrl = 'https://localhost:44328/api/app/comment';

  constructor(private http: HttpClient) { }

  getComments(skipCount: number = 0, maxResultCount: number = 25, sorting?: string): Observable<CommentListResponse> {
    let params = new HttpParams()
      .set('SkipCount', skipCount.toString())
      .set('MaxResultCount', maxResultCount.toString());

    if (sorting) {
      params = params.set('Sorting', sorting);
    }

    return this.http.get<CommentListResponse>(this.apiUrl, { params });
  }

  createComment(comment: CreateUpdateCommentDto): Observable<CommentDto> {
    return this.http.post<CommentDto>(this.apiUrl, comment);
  }

  getCaptcha(): Observable<CaptchaResponse> {
    return this.http.get<CaptchaResponse>('https://localhost:44328/api/app/comment/captcha');
  }

  uploadFile(file: File): Observable<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filePath: string }>('https://localhost:44328/api/app/comment/upload', formData);
  }
}
