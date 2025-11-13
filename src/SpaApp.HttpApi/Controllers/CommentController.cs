using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpaApp.CommentQueue.Dtos;
using SpaApp.Comments;
using SpaApp.Comments.Dtos;
using SpaApp.Permissions;
using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;

namespace SpaApp.Controllers
{

    [Authorize]
    [Route("api/app/comment")]
    public class CommentController : SpaAppController
    {
        private readonly ICommentAppService _commentAppService;

        public CommentController(ICommentAppService commentAppService)
        {
            _commentAppService = commentAppService;
        }

        [HttpGet]
        [Authorize(SpaAppPermissions.Comments.Default)]
        public Task<PagedResultDto<CommentDto>> GetListAsync([FromQuery] CommentGetListDto input)
        {
            return _commentAppService.GetListAsync(input);
        }

        [HttpGet("{id}")]
        [Authorize(SpaAppPermissions.Comments.Default)]
        public Task<CommentDto> GetAsync(Guid id)
        {
            return _commentAppService.GetAsync(id);
        }

        [HttpGet("{id}/with-replies")]
        [Authorize(SpaAppPermissions.Comments.Default)]
        public Task<CommentDto> GetWithRepliesAsync(Guid id, [FromQuery] int maxDepth = 3)
        {
            return _commentAppService.GetWithRepliesAsync(id, maxDepth);
        }

        [HttpGet("{commentId}/replies")]
        [Authorize(SpaAppPermissions.Comments.Default)]
        public Task<PagedResultDto<CommentDto>> GetRepliesAsync(
            Guid commentId,
            [FromQuery] PagedAndSortedResultRequestDto input)
        {
            return _commentAppService.GetRepliesAsync(new GetRepliesRequestDto
            {
                CommentId = commentId,
                SkipCount = input.SkipCount,
                MaxResultCount = input.MaxResultCount,
                Sorting = input.Sorting
            });
        }

        [HttpPost]
        [Authorize(SpaAppPermissions.Comments.Create)]
        public Task<CommentDto> CreateAsync([FromBody] CreateUpdateCommentDto input)
        {
            return _commentAppService.CreateAsync(input);
        }

        [HttpPut("{id}")]
        [Authorize(SpaAppPermissions.Comments.Edit)]
        public Task<CommentDto> UpdateAsync(Guid id, [FromBody] CreateUpdateCommentDto input)
        {
            return _commentAppService.UpdateAsync(id, input);
        }

        [HttpDelete("{id}")]
        [Authorize(SpaAppPermissions.Comments.Delete)]
        public Task DeleteAsync(Guid id)
        {
            return _commentAppService.DeleteAsync(id);
        }

        [HttpPost("queued")]
        [IgnoreAntiforgeryToken]
        [Authorize(SpaAppPermissions.Comments.Create)]
        public Task<CommentQueueResponseDto> CreateQueuedAsync([FromBody] CreateUpdateCommentDto input)
        {
            return _commentAppService.CreateQueuedAsync(input);
        }

        [HttpGet("queue/{queueId}/status")]
        [Authorize(SpaAppPermissions.Comments.Default)]
        public Task<CommentQueueStatusDto> GetQueueStatusAsync(Guid queueId)
        {
            return _commentAppService.GetQueueStatusAsync(queueId);
        }
    }
}