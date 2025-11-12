using SpaApp.Comments.Dtos;
using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

public class CommentDto : AuditedEntityDto<Guid>
{
    public Guid Id { get; set; }
    public DateTime CreationTime { get; set; }
    public Guid? CreatorId { get; set; }
    public DateTime? LastModificationTime { get; set; }
    public Guid? LastModifierId { get; set; }
    public Guid? ParentId { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public string? Homepage { get; set; }
    public string Text { get; set; }
    public Guid? FileId { get; set; }
    public string FileName { get; set; }
    public string FileType { get; set; }
    public long? FileSize { get; set; }
    public string PreviewUrl { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string TextContent { get; set; }
    public List<CommentFileDto> Files { get; set; } = new();
    public List<CommentDto> Replies { get; set; } = new();
    public int RepliesCount { get; set; }
    public bool HasReplies { get; set; }
    public bool RepliesLoaded { get; set; }
}
