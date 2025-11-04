using AutoMapper;
using SpaApp.Books;
using SpaApp.Comments;

namespace SpaApp;

public class SpaAppApplicationAutoMapperProfile : Profile
{
    public SpaAppApplicationAutoMapperProfile()
    {
        CreateMap<Comment, CommentDto>();
        CreateMap<CreateUpdateCommentDto, Comment>();
        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
