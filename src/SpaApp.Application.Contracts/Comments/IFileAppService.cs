using SpaApp.Comments.Dtos;
using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace SpaApp.Comments
{
    public interface IFileAppService : IApplicationService
    {
        Task<FileUploadResultDto> UploadImageAsync(FileUploadInputDto input);
        Task<FileUploadResultDto> UploadTextFileAsync(FileUploadInputDto input);
        Task<FileDto> GetFileAsync(Guid id);
        Task DeleteFileAsync(Guid id);
    }
}
