using SpaApp.Comments.Dtos;
using System;

namespace SpaApp.CommentQueue.Models
{
    public class CommentQueueItem
    {
        public Guid Id { get; set; }
        public CreateUpdateCommentDto CommentDto { get; set; }
        public QueueStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string ErrorMessage { get; set; }
        public CommentDto Result { get; set; }
    }
}
