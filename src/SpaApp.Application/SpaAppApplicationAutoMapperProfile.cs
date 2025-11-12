using AutoMapper;
using SpaApp.Comments;
using SpaApp.Comments.Dtos;

namespace SpaApp;

public class SpaAppApplicationAutoMapperProfile : Profile
{
    public SpaAppApplicationAutoMapperProfile()
    {
        /* Comment mappings */
        CreateMap<Comment, CommentDto>()
            .ForMember(dest => dest.Files, opt => opt.MapFrom(src => src.Files));

        CreateMap<CreateUpdateCommentDto, Comment>();
        CreateMap<CommentFile, CommentFileDto>();

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}