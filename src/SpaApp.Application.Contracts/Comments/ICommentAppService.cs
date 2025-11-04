using SpaApp.Comments;
using System;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace SpaApp.Books;

public interface ICommentAppService :
    ICrudAppService< //Defines CRUD methods
        CommentDto, //Used to show books
        Guid, //Primary key of the book entity
        PagedAndSortedResultRequestDto, //Used for paging/sorting
        CreateUpdateCommentDto> //Used to create/update a book
{

}