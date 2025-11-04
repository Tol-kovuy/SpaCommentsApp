using AutoMapper;
using SpaApp.Books;

namespace SpaApp;

public class SpaAppApplicationAutoMapperProfile : Profile
{
    public SpaAppApplicationAutoMapperProfile()
    {
        CreateMap<Book, BookDto>();
        CreateMap<CreateUpdateBookDto, Book>();
        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
