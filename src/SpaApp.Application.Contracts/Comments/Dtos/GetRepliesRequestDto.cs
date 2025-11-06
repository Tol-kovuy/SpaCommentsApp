using System;
using Volo.Abp.Application.Dtos;

namespace SpaApp.Comments.Dtos
{
    public class GetRepliesRequestDto : PagedAndSortedResultRequestDto
    {
        public Guid CommentId { get; set; }
    }
}
