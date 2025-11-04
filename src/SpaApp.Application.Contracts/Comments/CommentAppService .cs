using Microsoft.AspNetCore.Authorization;
using SpaApp.Permissions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using SpaApp.Comments;

namespace SpaApp.Comments;

[Authorize(SpaAppPermissions.Comments.Default)]
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

        // Только родительские комментарии (без ParentId) + сортировка LIFO по умолчанию
        var parentQuery = queryable
            .Where(x => x.ParentId == null)
            .OrderBy(input.Sorting.IsNullOrWhiteSpace() ? "CreationTime desc" : input.Sorting)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount);

        var comments = await AsyncExecuter.ToListAsync(parentQuery);
        var totalCount = await AsyncExecuter.CountAsync(queryable.Where(x => x.ParentId == null));

        // Загружаем ответы для каждого комментария
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

        // Рекурсивно загружаем ответы для каждого ответа
        foreach (var reply in commentDto.Replies)
        {
            await LoadRepliesAsync(reply);
        }
    }

    [Authorize(SpaAppPermissions.Comments.Create)]
    public override async Task<CommentDto> CreateAsync(CreateUpdateCommentDto input)
    {
        // TODO: Добавить валидацию CAPTCHA
        // TODO: Добавить обработку файлов
        // TODO: Добавить сбор информации о пользователе (IP, браузер)

        var comment = ObjectMapper.Map<CreateUpdateCommentDto, Comment>(input);
        await _repository.InsertAsync(comment, autoSave: true);
        return ObjectMapper.Map<Comment, CommentDto>(comment);
    }
}