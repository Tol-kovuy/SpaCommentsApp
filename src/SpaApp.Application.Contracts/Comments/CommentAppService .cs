using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using SpaApp.Permissions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace SpaApp.Comments;

[Authorize(SpaAppPermissions.Comments.Default)]
[RemoteService(Name = "Default")]
[Route("api/app/comment")]
public class CommentAppService :
    CrudAppService<Comment, CommentDto, Guid, PagedAndSortedResultRequestDto, CreateUpdateCommentDto>,
    ICommentAppService
{
    private readonly IRepository<Comment, Guid> _repository;

    public CommentAppService(IRepository<Comment, Guid> repository)
        : base(repository)
    {
        _repository = repository;
    }

    public override async Task<PagedResultDto<CommentDto>> GetListAsync(PagedAndSortedResultRequestDto input)
    {
        var queryable = await _repository.GetQueryableAsync();

        var parentQuery = queryable
            .Where(x => x.ParentId == null)
            .OrderBy(input.Sorting.IsNullOrWhiteSpace() ? "CreationTime desc" : input.Sorting)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount);

        var comments = await AsyncExecuter.ToListAsync(parentQuery);
        var totalCount = await AsyncExecuter.CountAsync(queryable.Where(x => x.ParentId == null));

        var commentDtos = ObjectMapper.Map<List<Comment>, List<CommentDto>>(comments);
        foreach (var commentDto in commentDtos)
        {
            await LoadRepliesAsync(commentDto);
        }

        return new PagedResultDto<CommentDto>(totalCount, commentDtos);
    }

    private async Task LoadRepliesAsync(CommentDto commentDto)
    {
        var queryable = await _repository.GetQueryableAsync();
        var replies = queryable
            .Where(x => x.ParentId == commentDto.Id)
            .OrderBy(x => x.CreationTime)
            .ToList();

        commentDto.Replies = ObjectMapper.Map<List<Comment>, List<CommentDto>>(replies);

        foreach (var reply in commentDto.Replies)
        {
            await LoadRepliesAsync(reply);
        }
    }

    [Authorize(SpaAppPermissions.Comments.Create)]
    public override async Task<CommentDto> CreateAsync(CreateUpdateCommentDto input)
    {
        try
        {
            Logger.LogInformation("Creating comment: {UserName}, {Email}, {Text}",
                input.UserName, input.Email, input.Text);

            // TODO: Добавить валидацию CAPTCHA
            // TODO: Добавить обработку файлов
            // TODO: Добавить сбор информации о пользователе (IP, браузер)

            var comment = ObjectMapper.Map<CreateUpdateCommentDto, Comment>(input);

            Logger.LogInformation("Mapped to entity: {Entity}", comment);

            await _repository.InsertAsync(comment, autoSave: true);

            Logger.LogInformation("Comment created with ID: {Id}", comment.Id);

            return ObjectMapper.Map<Comment, CommentDto>(comment);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating comment: {Message}", ex.Message);
            throw;
        }
    }
}