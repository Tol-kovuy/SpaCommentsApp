using Microsoft.Extensions.Caching.Memory;
using SpaApp.Comments.Dtos;
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Threading.Tasks;

namespace SpaApp.Comments
{
    public class CaptchaService : ICaptchaService
    {
        private readonly IMemoryCache _memoryCache;
        private static readonly char[] chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();
        private static readonly Random random = new Random();

        public CaptchaService(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }

        public async Task<CaptchaResponseDto> GenerateCaptchaAsync()
        {
            string captchaText = RandomString(6);
            var captchaId = Guid.NewGuid().ToString();
            _memoryCache.Set($"captcha:{captchaId}", captchaText, TimeSpan.FromMinutes(10));
            using var bmp = new Bitmap(120, 40);
            using var graphics = Graphics.FromImage(bmp);
            graphics.Clear(Color.White);
            using var font = new Font("Arial", 20, FontStyle.Bold);
            using var brush = new SolidBrush(Color.Black);
            graphics.DrawString(captchaText, font, brush, 10, 5);
            using var ms = new MemoryStream();
            bmp.Save(ms, ImageFormat.Png);
            var imgBytes = ms.ToArray();
            var base64Img = Convert.ToBase64String(imgBytes);

            return new CaptchaResponseDto { CaptchaId = captchaId, Image = $"data:image/png;base64,{base64Img}" };
        }

        public bool ValidateCaptcha(string captchaId, string value)
        {
            if (!_memoryCache.TryGetValue($"captcha:{captchaId}", out string expected))
            {     
                return false;
            }

            _memoryCache.Remove($"captcha:{captchaId}");

            return expected?.Trim().ToUpper() == value?.Trim().ToUpper();
        }

        private static string RandomString(int length)
        {
            var s = new char[length];
            for (int i = 0; i < length; i++)
            {
                s[i] = chars[random.Next(chars.Length)];
            }

            return new string(s);
        }
    }
}
