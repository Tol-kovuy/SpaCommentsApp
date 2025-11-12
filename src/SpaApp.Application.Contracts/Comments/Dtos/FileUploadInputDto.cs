using System;

namespace SpaApp.Comments.Dtos
{
    public class FileUploadInputDto
    {
        public string FileName { get; set; }
        public string ContentType { get; set; }
        public byte[] Content { get; set; }
        public Guid? CommentId { get; set; }
        public string TextContent { get; set; }
    }
}
