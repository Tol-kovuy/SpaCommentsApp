using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpaApp.Comments;
using SpaApp.Permissions;
using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;

namespace SpaApp.Controllers;

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
    public Task<PagedResultDto<CommentDto>> GetListAsync([FromQuery] PagedAndSortedResultRequestDto input)
    {
        return _commentAppService.GetListAsync(input);
    }

    [HttpGet("{id}")]
    [Authorize(SpaAppPermissions.Comments.Default)]
    public Task<CommentDto> GetAsync(Guid id)
    {
        return _commentAppService.GetAsync(id);
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
}