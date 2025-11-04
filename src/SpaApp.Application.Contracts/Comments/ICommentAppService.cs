using System;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace SpaApp.Comments;

public interface ICommentAppService :
    ICrudAppService<
        CommentDto,
        Guid,
        PagedAndSortedResultRequestDto,
        CreateUpdateCommentDto>
{
}