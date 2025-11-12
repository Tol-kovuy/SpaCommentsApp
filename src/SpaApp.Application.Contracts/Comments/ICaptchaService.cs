using SpaApp.Comments.Dtos;
using System.Threading.Tasks;

namespace SpaApp.Comments
{
    public interface ICaptchaService
    {
        Task<CaptchaResponseDto> GenerateCaptchaAsync();

        bool ValidateCaptcha(string captchaId, string value);
    }
}
