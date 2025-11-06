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
            .ForMember(dest => dest.Replies, opt => opt.MapFrom(src => src.Replies))
            .ForMember(dest => dest.RepliesCount, opt => opt.Ignore())
            .ForMember(dest => dest.RepliesLoaded, opt => opt.Ignore());

        CreateMap<CreateUpdateCommentDto, Comment>();

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}