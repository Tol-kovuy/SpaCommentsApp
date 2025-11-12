using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Domain.Entities;

namespace SpaApp.Comments
{
    public class CommentFile : Entity<Guid>
    {
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; }

        [MaxLength(500)]
        public string? FilePath { get; set; } 

        [MaxLength(4000)]
        public string? TextContent { get; set; } 

        [Required]
        [MaxLength(50)]
        public string FileType { get; set; } 

        [MaxLength(100)]
        public string? ContentType { get; set; }

        public long FileSize { get; set; }

        public int? Width { get; set; }
        public int? Height { get; set; }

        public Guid? CommentId { get; set; } 

        public virtual Comment? Comment { get; set; } 

        public DateTime CreationTime { get; set; } = DateTime.Now;
    }
}