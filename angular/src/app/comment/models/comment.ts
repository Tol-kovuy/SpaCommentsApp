export interface CommentDto {
  id: string;
  userName: string;
  email: string;
  homepage?: string;
  text: string;
  creationTime: string;
  parentId?: string;
  replies?: CommentDto[];
  repliesCount: number;
  repliesLoaded: boolean;
  hasReplies: boolean;
  fileId?: string;
  fileName?: string;
  filePath?: string;
  fileType?: string;
  contentType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  textContent?: string;
  previewUrl?: string;
  lastModificationTime?: string;
  creatorId?: string;
  lastModifierId?: string;
}

export interface CreateUpdateCommentDto {
  userName: string;
  email: string;
  homepage?: string;
  text: string;
  captcha: string; 
  captchaId: string;
  fileId?: string;
  parentId?: string;
}

export interface CommentGetListDto {
  filter?: string;
  skipCount: number;
  maxResultCount: number;
  sorting?: string;
  parentId?: string | null;
}

export interface GetRepliesRequestDto {
  commentId: string;
  skipCount: number;
  maxResultCount: number;
  sorting?: string;
}
