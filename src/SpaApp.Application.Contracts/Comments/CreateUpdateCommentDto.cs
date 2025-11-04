using System;
using System.ComponentModel.DataAnnotations;

namespace SpaApp.Comments;

public class CreateUpdateCommentDto
{
    public Guid? ParentId { get; set; }

    [Required]
    [StringLength(64)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Url]
    public string? Homepage { get; set; }

    [Required]
    [StringLength(1024)]
    public string Text { get; set; } = string.Empty;

    [StringLength(256)]
    public string? FilePath { get; set; }

    [StringLength(64)]
    public string? FileType { get; set; }
}
