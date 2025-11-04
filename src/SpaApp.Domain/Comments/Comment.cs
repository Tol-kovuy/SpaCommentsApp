using System;
using System.Collections.Generic;
using Volo.Abp.Domain.Entities.Auditing;

namespace SpaApp.Comments;

public class Comment : AuditedAggregateRoot<Guid>
{
    public Guid? ParentId { get; set; }
    public Comment? Parent { get; set; }

    public string UserName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Homepage { get; set; }
    public string Text { get; set; } = default!;
    public string? FilePath { get; set; }
    public string? FileType { get; set; }

    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}