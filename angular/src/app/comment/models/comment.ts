export interface CommentDto {
  id: string;
  userName: string;
  email: string;
  homepage?: string;
  text: string;
  creationTime: string;
  replies?: CommentDto[];
  parentId?: string;
}

export interface CreateUpdateCommentDto {
  userName: string;
  email: string;
  homepage?: string;
  text: string;
  captcha: string;
  filePath?: string;
  parentId?: string;
}

export interface CommentListResponse {
  items: CommentDto[];
  totalCount: number;
}

export interface CaptchaResponse {
  imageUrl: string;
  token: string;
}
