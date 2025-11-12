import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '@abp/ng.core';
import { CommentDto, CreateUpdateCommentDto, CommentGetListDto } from '../models/comment';
import { HttpClient } from '@angular/common/http'; 

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = '/api/app/comment';

  constructor(
    private restService: RestService,
    private http: HttpClient
  ) { }

  getComments(input: CommentGetListDto): Observable<any> {
    return this.restService.request<any, any>({
      method: 'GET',
      url: this.apiUrl,
      params: {
        SkipCount: input.skipCount,
        MaxResultCount: input.maxResultCount,
        Sorting: input.sorting,
        ...(input.filter && { Filter: input.filter }),
        ...(input.parentId !== undefined && { ParentId: input.parentId || '' })
      }
    });
  }

  getReplies(commentId: string, skipCount: number, maxResultCount: number, sorting?: string): Observable<any> {
    return this.restService.request<any, any>({
      method: 'GET',
      url: `${this.apiUrl}/${commentId}/replies`,
      params: {
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
        Sorting: sorting || 'creationTime asc'
      }
    });
  }

  createComment(comment: CreateUpdateCommentDto): Observable<any> {
    return this.restService.request<any, CreateUpdateCommentDto>({
      method: 'POST',
      url: this.apiUrl,
      body: comment
    });
  }

  updateComment(id: string, comment: CreateUpdateCommentDto): Observable<CommentDto> {
    return this.restService.request<CreateUpdateCommentDto, CommentDto>({
      method: 'PUT',
      url: `${this.apiUrl}/${id}`,
      body: comment
    });
  }

  deleteComment(id: string): Observable<void> {
    return this.restService.request<void, void>({
      method: 'DELETE',
      url: `${this.apiUrl}/${id}`
    });
  }
}
