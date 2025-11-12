using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Domain.Entities.Auditing;

namespace SpaApp.Comments;

public class Comment : AuditedAggregateRoot<Guid>
{
    public Guid? ParentId { get; set; }
    public Comment? Parent { get; set; }

    [Required]
    [MaxLength(100)]
    public string UserName { get; set; } = default!;

    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = default!;

    [MaxLength(500)]
    [Url]
    public string? Homepage { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = default!;

    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public virtual ICollection<CommentFile> Files { get; set; } = new List<CommentFile>();

    public Comment()
    {
        Replies = new List<Comment>();
        Files = new List<CommentFile>();
    }
}