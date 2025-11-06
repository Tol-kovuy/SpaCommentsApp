using Microsoft.AspNetCore.Authorization;
using SpaApp.Comments.Dtos;
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
using Volo.Abp.Uow;

namespace SpaApp.Comments;

[Authorize(SpaAppPermissions.Comments.Default)]
[RemoteService(Name = "Default")]
public class CommentAppService :
    CrudAppService<Comment, CommentDto, Guid, CommentGetListDto, CreateUpdateCommentDto>,
    ICommentAppService
{
    private readonly IRepository<Comment, Guid> _repository;

    public CommentAppService(IRepository<Comment, Guid> repository)
        : base(repository)
    {
        _repository = repository;
    }

    [UnitOfWork(isTransactional: false)]
    public override async Task<PagedResultDto<CommentDto>> GetListAsync(CommentGetListDto input)
    {
        var queryable = await _repository.GetQueryableAsync();

        IQueryable<Comment> parentQuery = queryable
            .Where(x => x.ParentId == null);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            parentQuery = parentQuery.Where(x =>
                x.Text.Contains(input.Filter) ||
                x.UserName.Contains(input.Filter));
        }

        var orderedQuery = input.Sorting.IsNullOrWhiteSpace()
            ? parentQuery.OrderByDescending(x => x.CreationTime)
            : parentQuery.OrderBy(input.Sorting);

        var totalCount = await AsyncExecuter.CountAsync(parentQuery);

        var comments = await AsyncExecuter.ToListAsync(
            orderedQuery.Skip(input.SkipCount).Take(input.MaxResultCount));

        var commentDtos = ObjectMapper.Map<List<Comment>, List<CommentDto>>(comments);

        foreach (var commentDto in commentDtos)
        {
            commentDto.RepliesCount = await GetRepliesCountAsync(commentDto.Id);
            commentDto.HasReplies = commentDto.RepliesCount > 0; 
        }

        return new PagedResultDto<CommentDto>(totalCount, commentDtos);
    }

    [UnitOfWork(isTransactional: false)]
    public async Task<PagedResultDto<CommentDto>> GetRepliesAsync(GetRepliesRequestDto input)
    {
        var queryable = await _repository.GetQueryableAsync();

        IQueryable<Comment> repliesQuery = queryable
            .Where(x => x.ParentId == input.CommentId);

        var orderedRepliesQuery = input.Sorting.IsNullOrWhiteSpace()
            ? repliesQuery.OrderBy(x => x.CreationTime)
            : repliesQuery.OrderBy(input.Sorting);

        var totalCount = await AsyncExecuter.CountAsync(repliesQuery);
        var replies = await AsyncExecuter.ToListAsync(
            orderedRepliesQuery.Skip(input.SkipCount).Take(input.MaxResultCount));

        var replyDtos = ObjectMapper.Map<List<Comment>, List<CommentDto>>(replies);

        foreach (var reply in replyDtos)
        {
            reply.RepliesCount = await GetRepliesCountAsync(reply.Id);
            reply.HasReplies = reply.RepliesCount > 0; // Теперь можно присваивать
        }

        return new PagedResultDto<CommentDto>(totalCount, replyDtos);
    }

    [UnitOfWork(isTransactional: false)]
    public async Task<CommentDto> GetWithRepliesAsync(Guid id, int maxDepth = 3)
    {
        var queryable = await _repository.GetQueryableAsync();
        var comment = await AsyncExecuter.FirstOrDefaultAsync(queryable.Where(x => x.Id == id));

        if (comment == null)
            throw new UserFriendlyException("Comment not found");

        var commentDto = ObjectMapper.Map<Comment, CommentDto>(comment);
        await LoadRepliesRecursiveAsync(commentDto, maxDepth, 0);

        return commentDto;
    }

    private async Task LoadRepliesRecursiveAsync(CommentDto commentDto, int maxDepth, int currentDepth)
    {
        if (currentDepth >= maxDepth) return;

        var queryable = await _repository.GetQueryableAsync();
        var replies = await AsyncExecuter.ToListAsync(
            queryable.Where(x => x.ParentId == commentDto.Id)
                    .OrderBy(x => x.CreationTime)
                    .Take(50) // ??? количество на уровень
        );

        commentDto.Replies = ObjectMapper.Map<List<Comment>, List<CommentDto>>(replies);
        commentDto.RepliesCount = await GetRepliesCountAsync(commentDto.Id);
        commentDto.HasReplies = commentDto.RepliesCount > 0; 

        foreach (var reply in commentDto.Replies)
        {
            await LoadRepliesRecursiveAsync(reply, maxDepth, currentDepth + 1);
        }
    }

    private async Task<int> GetRepliesCountAsync(Guid commentId)
    {
        var queryable = await _repository.GetQueryableAsync();
        return await AsyncExecuter.CountAsync(queryable.Where(x => x.ParentId == commentId));
    }

    [Authorize(SpaAppPermissions.Comments.Create)]
    public override async Task<CommentDto> CreateAsync(CreateUpdateCommentDto input)
    {
        var comment = ObjectMapper.Map<CreateUpdateCommentDto, Comment>(input);
        await _repository.InsertAsync(comment, autoSave: true);
        return ObjectMapper.Map<Comment, CommentDto>(comment);
    }
}