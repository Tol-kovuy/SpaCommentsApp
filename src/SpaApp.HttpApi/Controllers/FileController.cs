using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SpaApp.Comments;
using SpaApp.Comments.Dtos;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace SpaApp.Controllers
{
    [RemoteService]
    [Route("api/app/file")]
    public class FileController : AbpController
    {
        private readonly IFileAppService _fileAppService;

        public FileController(IFileAppService fileAppService)
        {
            _fileAppService = fileAppService;
        }

        [HttpPost]
        [Route("upload-image")]
        [IgnoreAntiforgeryToken]
        [AllowAnonymous]
        public async Task<FileUploadResultDto> UploadImageAsync([FromForm] FileUploadFormDto input)
        {
            if (input.File == null || input.File.Length == 0)
            {
                throw new UserFriendlyException("File is required");
            }

            using var memoryStream = new MemoryStream();
            await input.File.CopyToAsync(memoryStream);

            var uploadInput = new FileUploadInputDto
            {
                FileName = input.File.FileName,
                ContentType = input.File.ContentType,
                Content = memoryStream.ToArray(),
                CommentId = input.CommentId
            };

            return await _fileAppService.UploadImageAsync(uploadInput);
        }

        [HttpPost]
        [Route("upload-text")]
        [IgnoreAntiforgeryToken]
        [AllowAnonymous]
        public async Task<FileUploadResultDto> UploadTextFileAsync([FromForm] FileUploadFormDto input)
        {
            if (input.File == null || input.File.Length == 0)
            {
                throw new UserFriendlyException("File is required");
            }

            using var memoryStream = new MemoryStream();
            await input.File.CopyToAsync(memoryStream);

            string textContent = await ExtractTextContent(memoryStream, input.File.ContentType);

            var uploadInput = new FileUploadInputDto
            {
                FileName = input.File.FileName,
                ContentType = input.File.ContentType,
                Content = memoryStream.ToArray(),
                CommentId = input.CommentId,
                TextContent = textContent
            };

            return await _fileAppService.UploadTextFileAsync(uploadInput);
        }

        private async Task<string> ExtractTextContent(MemoryStream stream, string contentType)
        {
            try
            {
                stream.Position = 0;

                if (contentType.ToLower().Contains("text"))
                {
                    using var reader = new StreamReader(stream, Encoding.UTF8);
                    return await reader.ReadToEndAsync();
                }

                return string.Empty;
            }
            catch (Exception ex)
            {
                Logger.LogInformation(ex, "Failed to extract text content from file");
                return string.Empty;
            }
        }

        [HttpGet]
        [Route("{id}")]
        [AllowAnonymous]
        public async Task<FileDto> GetFileAsync(Guid id)
        {
            return await _fileAppService.GetFileAsync(id);
        }

        [HttpDelete]
        [Route("{id}")]
        [AllowAnonymous]
        public async Task DeleteFileAsync(Guid id)
        {
            await _fileAppService.DeleteFileAsync(id);
        }
    }
}