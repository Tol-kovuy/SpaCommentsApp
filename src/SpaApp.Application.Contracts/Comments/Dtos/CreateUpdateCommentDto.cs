using System;

namespace SpaApp.Comments.Dtos
{
    public class CreateUpdateCommentDto
    {
        public Guid? ParentId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string? Homepage { get; set; }
        public string Text { get; set; }
        public string? Captcha { get; set; }
        public string CaptchaId { get; set; }
        public Guid? FileId { get; set; }
    }
}
