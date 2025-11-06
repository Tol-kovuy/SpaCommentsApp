using Volo.Abp.Application.Dtos;

namespace SpaApp.Comments.Dtos
{
    public class CommentGetListDto : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
    }
}
