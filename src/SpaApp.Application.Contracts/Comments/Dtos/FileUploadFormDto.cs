using Microsoft.AspNetCore.Http;
using System;

namespace SpaApp.Comments.Dtos
{
    public class FileUploadFormDto
    {
        public IFormFile File { get; set; }
        public Guid? CommentId { get; set; }
    }
}
