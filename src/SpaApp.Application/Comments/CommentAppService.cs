using Microsoft.AspNetCore.Authorization;
using SpaApp.Books;
using SpaApp.Permissions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace SpaApp.Comments;

[Authorize(SpaAppPermissions.Comments.Default)]
public class CommentAppService : ApplicationService, ICommentAppService
{
    private readonly IRepository<Comment, Guid> _repository;

    public CommentAppService(IRepository<Comment, Guid> repository)
    {
        _repository = repository;
    }

    public async Task<CommentDto> GetAsync(Guid id)
    {
        var comment = await _repository.GetAsync(id);
        return ObjectMapper.Map<Comment, CommentDto>(comment);
    }

    public async Task<PagedResultDto<CommentDto>> GetListAsync(PagedAndSortedResultRequestDto input)
    {
        var queryable = await _repository.GetQueryableAsync();

        // сортировка по умолчанию - LIFO (новые сверху)
        var query = queryable
            .OrderBy(input.Sorting.IsNullOrWhiteSpace() ? "CreationTime desc" : input.Sorting)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount);

        var comments = await AsyncExecuter.ToListAsync(query);
        var totalCount = await AsyncExecuter.CountAsync(queryable);

        return new PagedResultDto<CommentDto>(
            totalCount,
            ObjectMapper.Map<List<Comment>, List<CommentDto>>(comments)
        );
    }

    [Authorize(SpaAppPermissions.Comments.Create)]
    public async Task<CommentDto> CreateAsync(CreateUpdateCommentDto input)
    {
        var comment = ObjectMapper.Map<CreateUpdateCommentDto, Comment>(input);
        await _repository.InsertAsync(comment, autoSave: true);
        return ObjectMapper.Map<Comment, CommentDto>(comment);
    }

    [Authorize(SpaAppPermissions.Comments.Edit)]
    public async Task<CommentDto> UpdateAsync(Guid id, CreateUpdateCommentDto input)
    {
        var comment = await _repository.GetAsync(id);
        ObjectMapper.Map(input, comment);
        await _repository.UpdateAsync(comment, autoSave: true);
        return ObjectMapper.Map<Comment, CommentDto>(comment);
    }

    [Authorize(SpaAppPermissions.Comments.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        await _repository.DeleteAsync(id);
    }
}
