using System;

namespace SpaApp.Comments.Dtos
{
    public class FileDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public string FileType { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public byte[] Content { get; set; }
        public string TextContent { get; set; }
    }
}
