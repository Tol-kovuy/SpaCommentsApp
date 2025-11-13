using System;

namespace SpaApp.CommentQueue.Dtos
{
    public class CommentQueueResponseDto
    {
        public Guid QueueId { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
    }
}
