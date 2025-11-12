using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using SpaApp.Comments.Dtos;
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Validation;

namespace SpaApp.Comments
{
    public class FileAppService : ApplicationService, IFileAppService
    {
        private readonly IRepository<CommentFile, Guid> _fileRepository;
        private readonly IRepository<Comment, Guid> _commentRepository;
        private readonly IHostingEnvironment _environment;

        private const string UploadsFolder = "uploads";
        private const int MaxImageWidth = 320;
        private const int MaxImageHeight = 240;
        private const long MaxTextFileSize = 100 * 1024; // 100 KB .txt
        private const long MaxImageFileSize = 5 * 1024 * 1024; // 5 MB for images

        public FileAppService(
            IRepository<CommentFile, Guid> fileRepository,
            IRepository<Comment, Guid> commentRepository,
            IHostingEnvironment environment)
        {
            _fileRepository = fileRepository;
            _commentRepository = commentRepository;
            _environment = environment;
        }

        public async Task<FileUploadResultDto> UploadImageAsync(FileUploadInputDto input)
        {
            try
            {
                ValidateFileInput(input);

                if (input.Content.Length > MaxImageFileSize)
                {
                    throw new UserFriendlyException($"Image size exceeds maximum allowed size of 5MB");
                }

                if (!IsValidImageFormat(input.ContentType))
                {
                    throw new UserFriendlyException("Invalid image format. Allowed formats: JPG, GIF, PNG");
                }

                if (input.CommentId.HasValue)
                {
                    var commentExists = await _commentRepository.AnyAsync(x => x.Id == input.CommentId.Value);
                    if (!commentExists)
                    {
                        throw new UserFriendlyException("Comment not found");
                    }
                }

                var processedImage = await ProcessImageAsync(input.Content);

                var filePath = await SaveImageToFileSystemAsync(processedImage, input.FileName);

                var fileEntity = new CommentFile
                {
                    FileName = SanitizeFileName(input.FileName),
                    FilePath = filePath,
                    FileType = "image",
                    ContentType = input.ContentType,
                    FileSize = processedImage.Length,
                    Width = MaxImageWidth,
                    Height = MaxImageHeight,
                    CommentId = input.CommentId
                };

                await _fileRepository.InsertAsync(fileEntity, autoSave: true);

                return new FileUploadResultDto
                {
                    Id = fileEntity.Id,
                    FileName = fileEntity.FileName,
                    FilePath = fileEntity.FilePath,
                    FileType = fileEntity.FileType,
                    FileSize = fileEntity.FileSize,
                    Width = fileEntity.Width,
                    Height = fileEntity.Height,
                    PreviewUrl = $"/api/app/file/{fileEntity.Id}"
                };
            }
            catch (UserFriendlyException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Image upload failed");
                throw new UserFriendlyException($"Image upload failed: {ex.Message}");
            }
        }

        public async Task<FileUploadResultDto> UploadTextFileAsync(FileUploadInputDto input)
        {
            try
            {
                Logger.LogInformation("=== FILE APP SERVICE: UPLOAD TEXT ===");
                Logger.LogInformation("FileName: {FileName}", input.FileName);
                Logger.LogInformation("ContentType: {ContentType}", input.ContentType);
                Logger.LogInformation("ContentLength: {ContentLength}", input.Content.Length);
                Logger.LogInformation("CommentId: {CommentId}", input.CommentId);

                ValidateFileInput(input);

                if (!IsValidTextFile(input.FileName, input.Content.Length))
                {
                    throw new UserFriendlyException("Invalid text file. Only .txt files up to 100KB are allowed");
                }

                if (input.CommentId.HasValue && input.CommentId.Value != Guid.Empty)
                {
                    var commentExists = await _commentRepository.AnyAsync(x => x.Id == input.CommentId.Value);
                    if (!commentExists)
                    {
                        Logger.LogWarning("Comment not found: {CommentId}", input.CommentId.Value);
                    }
                }

                var textContent = Encoding.UTF8.GetString(input.Content);
                Logger.LogInformation("Text content length: {Length}", textContent.Length);

                // protected by XSS 
                textContent = SanitizeTextContent(textContent);

                var fileEntity = new CommentFile
                {
                    FileName = SanitizeFileName(input.FileName),
                    FilePath = null,
                    TextContent = textContent,
                    FileType = "text",
                    ContentType = "text/plain",
                    FileSize = input.Content.Length,
                    CommentId = input.CommentId
                };

                await _fileRepository.InsertAsync(fileEntity, autoSave: true);
                Logger.LogInformation("File created with ID: {FileId}", fileEntity.Id);

                return new FileUploadResultDto
                {
                    Id = fileEntity.Id,
                    FileName = fileEntity.FileName,
                    FilePath = fileEntity.FilePath,
                    FileType = fileEntity.FileType,
                    FileSize = fileEntity.FileSize,
                    TextContent = fileEntity.TextContent,
                    PreviewUrl = $"/api/app/file/{fileEntity.Id}"
                };
            }
            catch (UserFriendlyException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Text file upload failed");
                throw new UserFriendlyException($"Text file upload failed: {ex.Message}");
            }
        }

        public async Task<FileDto> GetFileAsync(Guid id)
        {
            var file = await _fileRepository.GetAsync(id);

            if (file.FileType == "text")
            {
                return new FileDto
                {
                    Id = file.Id,
                    FileName = file.FileName,
                    FilePath = file.FilePath,
                    FileType = file.FileType,
                    ContentType = file.ContentType,
                    FileSize = file.FileSize,
                    Content = Encoding.UTF8.GetBytes(file.TextContent ?? string.Empty)
                };
            }
            else
            {
                if (string.IsNullOrEmpty(file.FilePath))
                {
                    throw new UserFriendlyException("File path not found");
                }

                var fullPath = GetFullPath(file.FilePath);
                if (!File.Exists(fullPath))
                {
                    throw new UserFriendlyException("File not found on disk");
                }

                var content = await File.ReadAllBytesAsync(fullPath);
                return new FileDto
                {
                    Id = file.Id,
                    FileName = file.FileName,
                    FilePath = file.FilePath,
                    FileType = file.FileType,
                    ContentType = file.ContentType,
                    FileSize = file.FileSize,
                    Width = file.Width,
                    Height = file.Height,
                    Content = content
                };
            }
        }

        public async Task DeleteFileAsync(Guid id)
        {
            var file = await _fileRepository.GetAsync(id);

            if (file.FileType == "image" && !string.IsNullOrEmpty(file.FilePath))
            {
                var fullPath = GetFullPath(file.FilePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }

            await _fileRepository.DeleteAsync(file);
        }

        private void ValidateFileInput(FileUploadInputDto input)
        {
            if (input.Content == null || input.Content.Length == 0)
            {
                throw new UserFriendlyException("File content is required");
            }

            if (string.IsNullOrWhiteSpace(input.FileName))
            {
                throw new UserFriendlyException("File name is required");
            }

            // protected by bad file name
            if (input.FileName.Contains("..") || input.FileName.Contains("/") || input.FileName.Contains("\\"))
            {
                throw new UserFriendlyException("Invalid file name");
            }
        }

        private async Task<byte[]> ProcessImageAsync(byte[] imageData)
        {
            try
            {
                using var ms = new MemoryStream(imageData);
                using var image = Image.FromStream(ms);

                if (image.Width <= MaxImageWidth && 
                    image.Height <= MaxImageHeight)
                {
                    return imageData;
                }

                var ratioX = (double)MaxImageWidth / image.Width;
                var ratioY = (double)MaxImageHeight / image.Height;
                var ratio = Math.Min(ratioX, ratioY);

                var newWidth = (int)(image.Width * ratio);
                var newHeight = (int)(image.Height * ratio);

                using var destImage = new Bitmap(newWidth, newHeight);
                using var graphics = Graphics.FromImage(destImage);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

                graphics.DrawImage(image, 0, 0, newWidth, newHeight);

                using var resultStream = new MemoryStream();
                destImage.Save(resultStream, GetImageFormat(image));
                return resultStream.ToArray();
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Image processing failed: {ex.Message}");
            }
        }

        private ImageFormat GetImageFormat(Image image)
        {
            if (image.RawFormat.Equals(ImageFormat.Jpeg)) return ImageFormat.Jpeg;
            if (image.RawFormat.Equals(ImageFormat.Png)) return ImageFormat.Png;
            if (image.RawFormat.Equals(ImageFormat.Gif)) return ImageFormat.Gif;

            return ImageFormat.Jpeg; 
        }

        private bool IsValidImageFormat(string contentType)
        {
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            return Array.Exists(allowedTypes, t => t.Equals(contentType, StringComparison.OrdinalIgnoreCase));
        }

        private bool IsValidTextFile(string fileName, long fileSize)
        {
            var extension = Path.GetExtension(fileName)?.ToLower();
            return extension == ".txt" && fileSize <= MaxTextFileSize;
        }

        private async Task<string> SaveImageToFileSystemAsync(byte[] content, string fileName)
        {
            var uploadsPath = Path.Combine(_environment.ContentRootPath, "wwwroot", UploadsFolder, "images");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{SanitizeFileName(fileName)}";
            var filePath = Path.Combine(UploadsFolder, "images", uniqueFileName);
            var fullPath = GetFullPath(filePath);

            await File.WriteAllBytesAsync(fullPath, content);
            return filePath;
        }

        private string GetFullPath(string relativePath)
        {
            return Path.Combine(_environment.ContentRootPath, "wwwroot", relativePath);
        }

        private string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();

            return string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries))
                       .Replace(" ", "_")
                       .ToLower();
        }

        private string SanitizeTextContent(string text)
        {
            // XSS 
            if (string.IsNullOrEmpty(text))
            {
                return text;
            }

            return text.Replace("<script", "&lt;script")
                      .Replace("</script>", "&lt;/script&gt;")
                      .Replace("javascript:", "javascript&#58;")
                      .Replace("onload=", "onload&#61;")
                      .Replace("onerror=", "onerror&#61;");
        }
    }
}