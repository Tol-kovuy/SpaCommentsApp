using System;

namespace SpaApp.CommentQueue.Dtos
{
    public class CommentQueueStatusDto
    {
        public Guid QueueId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string ErrorMessage { get; set; }
        public CommentDto Result { get; set; }
    }
}
