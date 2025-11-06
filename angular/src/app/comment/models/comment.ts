export interface CommentDto {
  id: string;
  parentId?: string;
  userName: string;
  email: string;
  homepage?: string;
  text: string;
  filePath?: string;
  fileType?: string;
  creationTime: string;
  replies: CommentDto[];
  repliesCount: number;
  hasReplies: boolean;
  repliesLoaded: boolean;
}

export interface CreateUpdateCommentDto {
  parentId?: string;
  userName: string;
  email: string;
  homepage?: string;
  text: string;
  captcha?: string;
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
