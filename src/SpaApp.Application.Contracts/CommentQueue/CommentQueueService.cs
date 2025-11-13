using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpaApp.CommentQueue.Models;
using SpaApp.Comments;
using SpaApp.Comments.Dtos;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.DependencyInjection;

namespace SpaApp.CommentQueue
{
    [ExposeServices(typeof(ICommentQueueService))]
    public class CommentQueueService : ICommentQueueService, IDisposable
    {
        private readonly ConcurrentDictionary<Guid, CommentQueueItem> _queue = new();
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CommentQueueService> _logger;
        private readonly Timer _timer;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        public CommentQueueService(
            IServiceProvider serviceProvider,
            ILogger<CommentQueueService> logger
            )
        {
            _serviceProvider = serviceProvider;
            _logger = logger;

            _timer = new Timer(_ =>
            {
                _ = ProcessQueueAsync(); 
                CleanupOldItems();
            }, null, TimeSpan.Zero, TimeSpan.FromMinutes(5));

            _logger.LogInformation("Comment Queue Service started");
        }

        public async Task<Guid> EnqueueCommentAsync(CreateUpdateCommentDto commentDto)
        {
            var queueItem = new CommentQueueItem
            {
                Id = Guid.NewGuid(),
                CommentDto = commentDto,
                Status = QueueStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _queue[queueItem.Id] = queueItem;

            _logger.LogInformation("Comment queued with ID: {QueueId}", queueItem.Id);

            _ = Task.Run(() => ProcessQueueItemAsync(queueItem.Id));

            return queueItem.Id;
        }

        public Task<CommentQueueItem> GetQueueStatusAsync(Guid queueId)
        {
            if (_queue.TryGetValue(queueId, out var item))
            {
                return Task.FromResult(item);
            }

            throw new UserFriendlyException("Queue item not found");
        }

        private async Task ProcessQueueItemAsync(Guid queueId)
        {
            await _semaphore.WaitAsync();
            try
            {
                if (!_queue.TryGetValue(queueId, out var item) || item.Status != QueueStatus.Pending)
                {
                    return;
                }

                item.Status = QueueStatus.Processing;
                _logger.LogInformation("Processing queued comment: {QueueId}", queueId);

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var commentAppService = scope.ServiceProvider.GetRequiredService<ICommentAppService>();

                    var result = await commentAppService.CreateAsync(item.CommentDto);

                    item.Status = QueueStatus.Completed;
                    item.ProcessedAt = DateTime.UtcNow;
                    item.Result = result;

                    _logger.LogInformation("Comment processed successfully: {QueueId}", queueId);
                }
                catch (Exception ex)
                {
                    item.Status = QueueStatus.Failed;
                    item.ErrorMessage = ex.Message;
                    _logger.LogError(ex, "Failed to process queued comment: {QueueId}", queueId);
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }

        private async Task ProcessQueueAsync()
        {
            try
            {
                var pendingItems = _queue.Values
                    .Where(x => x.Status == QueueStatus.Pending &&
                               DateTime.UtcNow - x.CreatedAt > TimeSpan.FromMinutes(1))
                    .ToList();

                foreach (var item in pendingItems)
                {
                    await ProcessQueueItemAsync(item.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing queue");
            }
        }

        private void CleanupOldItems()
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddHours(-1);
                var oldItems = _queue.Where(x => x.Value.CreatedAt < cutoff).ToList();

                foreach (var item in oldItems)
                {
                    _queue.TryRemove(item.Key, out _);
                }

                if (oldItems.Any())
                {
                    _logger.LogInformation("Cleaned up {Count} old queue items", oldItems.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old queue items");
            }
        }

        public void Dispose()
        {
            _timer?.Dispose();
            _semaphore?.Dispose();
            _logger.LogInformation("Comment Queue Service disposed");
        }
    }
}