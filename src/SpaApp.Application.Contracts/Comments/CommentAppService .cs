using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpaApp.CommentQueue;
using SpaApp.CommentQueue.Dtos;
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
    CrudAppService<
        Comment, 
        CommentDto, 
        Guid, 
        CommentGetListDto, 
        CreateUpdateCommentDto
        >,
    ICommentAppService
{
    private readonly IRepository<Comment, Guid> _repository;
    private readonly IRepository<CommentFile, Guid> _fileRepository;
    private readonly ICommentQueueService _queueService;
    private const string _fileBase = "/api/app/file/";

    public CommentAppService(
     IRepository<Comment, Guid> repository,
     IRepository<CommentFile, Guid> fileRepository,
     ICommentQueueService queueService
        ) 
     : base(repository)
    {
        _repository = repository;
        _fileRepository = fileRepository;
        _queueService = queueService;
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
                x.UserName.Contains(input.Filter)
                );
        }

        var orderedQuery = input.Sorting.IsNullOrWhiteSpace()
            ? parentQuery.OrderByDescending(x => x.CreationTime)
            : parentQuery.OrderBy(input.Sorting);

        var totalCount = await AsyncExecuter.CountAsync(parentQuery);

        var comments = await AsyncExecuter.ToListAsync(
            orderedQuery.Skip(input.SkipCount).Take(input.MaxResultCount));

        var commentDtos = ObjectMapper.Map<List<Comment>, List<CommentDto>>(comments);

        await LoadFilesForCommentsAsync(commentDtos);

        foreach (var commentDto in commentDtos)
        {
            commentDto.RepliesCount = await GetRepliesCountAsync(commentDto.Id);
            commentDto.HasReplies = commentDto.RepliesCount > 0;
        }

        return new PagedResultDto<CommentDto>(totalCount, commentDtos);
    }

    private async Task LoadFilesForCommentsAsync(List<CommentDto> commentDtos)
    {
        var commentIds = commentDtos.Select(c => c.Id).ToList();

        if (!commentIds.Any()) return;

        var fileQueryable = await _fileRepository.GetQueryableAsync();
        var files = await AsyncExecuter.ToListAsync(
            fileQueryable.Where(f => commentIds.Contains(f.CommentId ?? Guid.Empty))
        );

        var filesByCommentId = files.GroupBy(f => f.CommentId ?? Guid.Empty)
                                   .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var commentDto in commentDtos)
        {
            if (filesByCommentId.TryGetValue(commentDto.Id, out var commentFiles))
            {
                commentDto.Files = ObjectMapper.Map<List<CommentFile>, List<CommentFileDto>>(commentFiles);

                var mainFile = commentFiles.FirstOrDefault();
                if (mainFile != null)
                {
                    commentDto.FileId = mainFile.Id;
                    commentDto.FileName = mainFile.FileName;
                    commentDto.FileType = mainFile.FileType;
                    commentDto.FileSize = mainFile.FileSize;
                    commentDto.PreviewUrl = $"{_fileBase}{mainFile.Id}";
                }
            }
        }
    }

    // todo: wtf?
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

        await LoadFilesForCommentsAsync(replyDtos);

        foreach (var reply in replyDtos)
        {
            reply.RepliesCount = await GetRepliesCountAsync(reply.Id);
            reply.HasReplies = reply.RepliesCount > 0;
        }

        return new PagedResultDto<CommentDto>(totalCount, replyDtos);
    }

    [UnitOfWork(isTransactional: false)]
    public async Task<CommentDto> GetWithRepliesAsync(Guid id, int maxDepth = 3)
    {
        var queryable = await _repository.GetQueryableAsync();
        var comment = await AsyncExecuter.FirstOrDefaultAsync(queryable.Where(x => x.Id == id));

        if (comment == null)
        {
            throw new UserFriendlyException("Comment not found");
        }

        var commentDto = ObjectMapper.Map<Comment, CommentDto>(comment);

        await LoadFilesForCommentAsync(commentDto);

        await LoadRepliesRecursiveAsync(commentDto, maxDepth, 0);

        return commentDto;
    }

    private async Task LoadFilesForCommentAsync(CommentDto commentDto)
    {
        var fileQueryable = await _fileRepository.GetQueryableAsync();
        var files = await AsyncExecuter.ToListAsync(
            fileQueryable.Where(f => f.CommentId == commentDto.Id)
        );

        commentDto.Files = ObjectMapper.Map<List<CommentFile>, List<CommentFileDto>>(files);

        var mainFile = files.FirstOrDefault();
        if (mainFile != null)
        {
            commentDto.FileId = mainFile.Id;
            commentDto.FileName = mainFile.FileName;
            commentDto.FileType = mainFile.FileType;
            commentDto.FileSize = mainFile.FileSize;
            commentDto.PreviewUrl = $"{_fileBase}{mainFile.Id}";
        }
    }

    private async Task LoadRepliesRecursiveAsync(CommentDto commentDto, int maxDepth, int currentDepth)
    {
        if (currentDepth >= maxDepth) return;

        var queryable = await _repository.GetQueryableAsync();
        var replies = await AsyncExecuter.ToListAsync(
            queryable.Where(x => x.ParentId == commentDto.Id)
                    .OrderBy(x => x.CreationTime)
                    .Take(50) 
        );

        commentDto.Replies = ObjectMapper.Map<List<Comment>, List<CommentDto>>(replies);

        await LoadFilesForCommentsAsync(commentDto.Replies);

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

        return await AsyncExecuter.CountAsync(
            queryable.Where(x => x.ParentId == commentId)
            );
    }

    [Authorize(SpaAppPermissions.Comments.Create)]
    public async Task<CommentQueueResponseDto> CreateQueuedAsync(CreateUpdateCommentDto input)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(input.UserName))
                throw new UserFriendlyException("User name is required");

            if (string.IsNullOrWhiteSpace(input.Email))
                throw new UserFriendlyException("Email is required");

            if (string.IsNullOrWhiteSpace(input.Text))
                throw new UserFriendlyException("Comment text is required");

            var queueId = await _queueService.EnqueueCommentAsync(input);

            Logger.LogInformation("Comment queued successfully. QueueId: {QueueId}", queueId);

            return new CommentQueueResponseDto
            {
                QueueId = queueId,
                Status = "Queued",
                Message = "Comment is being processed"
            };
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to queue comment");
            throw new UserFriendlyException($"Failed to queue comment: {ex.Message}");
        }
    }

    [Authorize(SpaAppPermissions.Comments.Default)]
    public async Task<CommentQueueStatusDto> GetQueueStatusAsync(Guid queueId)
    {
        try
        {
            var queueItem = await _queueService.GetQueueStatusAsync(queueId);

            return new CommentQueueStatusDto
            {
                QueueId = queueItem.Id,
                Status = queueItem.Status.ToString(),
                CreatedAt = queueItem.CreatedAt,
                ProcessedAt = queueItem.ProcessedAt,
                ErrorMessage = queueItem.ErrorMessage,
                Result = queueItem.Result
            };
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to get queue status for {QueueId}", queueId);
            throw new UserFriendlyException($"Failed to get queue status: {ex.Message}");
        }
    }

    [Authorize(SpaAppPermissions.Comments.Create)]
    public override async Task<CommentDto> CreateAsync(CreateUpdateCommentDto input)
    {
        if (!input.ParentId.HasValue || input.ParentId.Value == Guid.Empty)
        {
            Logger.LogInformation("Main comment - CAPTCHA validation required");

            if (string.IsNullOrEmpty(input.CaptchaId) || string.IsNullOrEmpty(input.Captcha))
            {
                Logger.LogWarning("CAPTCHA validation failed: CaptchaId or Captcha value is empty");
                throw new UserFriendlyException("CAPTCHA is required for main comments");
            }

            var captchaService = ServiceProvider.GetRequiredService<ICaptchaService>();
            bool isCaptchaValid = captchaService.ValidateCaptcha(input.CaptchaId, input.Captcha);

            Logger.LogInformation("CAPTCHA validation result: {IsValid}", isCaptchaValid);

            if (!isCaptchaValid)
            {
                Logger.LogWarning("CAPTCHA validation failed: Invalid captcha code");
                throw new UserFriendlyException("Invalid CAPTCHA. Please try again.");
            }

            Logger.LogInformation("CAPTCHA validation successful");
        }
        else
        {
            Logger.LogInformation("Reply comment - CAPTCHA validation skipped");
        }

        var comment = ObjectMapper.Map<CreateUpdateCommentDto, Comment>(input);

        await _repository.InsertAsync(comment, autoSave: true);

        Logger.LogInformation("Comment created with Id: {CommentId}, ParentId: {ParentId}",
            comment.Id, comment.ParentId);

        if (input.FileId.HasValue)
        {
            Logger.LogInformation("Linking file {FileId} to comment {CommentId}",
                input.FileId.Value, comment.Id);
            await LinkFileToCommentAsync(input.FileId.Value, comment.Id);
        }
        else
        {
            Logger.LogInformation("No FileId provided, skipping file linking");
        }

        var commentDto = ObjectMapper.Map<Comment, CommentDto>(comment);

        if (input.FileId.HasValue)
        {
            var fileRepository = ServiceProvider.GetRequiredService<IRepository<CommentFile, Guid>>();
            var file = await fileRepository.FirstOrDefaultAsync(f => f.Id == input.FileId.Value);

            if (file != null)
            {
                commentDto.FileId = file.Id;
                commentDto.FileName = file.FileName;
                commentDto.FileType = file.FileType;
                commentDto.FileSize = file.FileSize;
                commentDto.PreviewUrl = $"{_fileBase}{file.Id}";
            }
        }

        return commentDto;
    }

    private async Task LinkFileToCommentAsync(Guid fileId, Guid commentId)
    {
        try
        {
            var fileRepository = ServiceProvider.GetRequiredService<IRepository<CommentFile, Guid>>();

            Logger.LogInformation("Getting file from repository...");
            var file = await fileRepository.GetAsync(fileId);

            if (file != null)
            {
                Logger.LogInformation("File found: {FileName}", file.FileName);
                Logger.LogInformation("Current CommentId: {CurrentCommentId}", file.CommentId);

                file.CommentId = commentId;
                await fileRepository.UpdateAsync(file, autoSave: true);

                Logger.LogInformation("Successfully linked file {FileId} to comment {CommentId}",
                    fileId, commentId);
            }
            else
            {
                Logger.LogWarning("File not found: {FileId}", fileId);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error linking file {FileId} to comment {CommentId}",
                fileId, commentId);
        }
    }
}