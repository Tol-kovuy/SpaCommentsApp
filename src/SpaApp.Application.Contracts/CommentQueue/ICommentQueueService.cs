using SpaApp.CommentQueue.Models;
using SpaApp.Comments.Dtos;
using System;
using System.Threading.Tasks;

namespace SpaApp.CommentQueue
{
    public interface ICommentQueueService
    {
        Task<Guid> EnqueueCommentAsync(CreateUpdateCommentDto commentDto);
        Task<CommentQueueItem> GetQueueStatusAsync(Guid queueId);
    }
}
