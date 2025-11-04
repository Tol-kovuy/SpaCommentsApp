using System;
using System.ComponentModel.DataAnnotations;

namespace SpaApp.Comments;

public class CreateUpdateCommentDto
{
    public Guid? ParentId { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public string? Homepage { get; set; }
    public string Text { get; set; }
    public string? Captcha { get; set; }
}
