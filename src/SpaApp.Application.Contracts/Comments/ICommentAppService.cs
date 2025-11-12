using SpaApp.Comments.Dtos;
using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace SpaApp.Comments;

public interface ICommentAppService :
    ICrudAppService<
        CommentDto,
        Guid,
        CommentGetListDto,
        CreateUpdateCommentDto>
{
    Task<PagedResultDto<CommentDto>> GetRepliesAsync(GetRepliesRequestDto input);

    Task<CommentDto> GetWithRepliesAsync(Guid id, int maxDepth = 3);
}