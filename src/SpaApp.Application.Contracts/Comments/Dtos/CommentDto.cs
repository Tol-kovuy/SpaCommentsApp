using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

public class CommentDto : AuditedEntityDto<Guid>
{
    public Guid? ParentId { get; set; }
    public string UserName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Homepage { get; set; }
    public string Text { get; set; } = default!;
    public string? FilePath { get; set; }
    public string? FileType { get; set; }
    public List<CommentDto> Replies { get; set; } = new List<CommentDto>();
    public int RepliesCount { get; set; }
    public bool HasReplies { get; set; } 
    public bool RepliesLoaded { get; set; }
}
