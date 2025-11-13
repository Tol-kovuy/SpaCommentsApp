using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SpaApp.Comments;
using SpaApp.Comments.Dtos;
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace SpaApp.Controllers
{
    [RemoteService]
    [Route("api/app/captcha")]
    public class CaptchaController : AbpController
    {
        private readonly IMemoryCache _memoryCache;
        private static readonly char[] chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();
        private static readonly Random random = new Random();

        public CaptchaController(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }

        [HttpGet]
        [IgnoreAntiforgeryToken]
        public IActionResult Get()
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

            return Ok(new CaptchaResponseDto
            {
                CaptchaId = captchaId,
                Image = $"data:image/png;base64,{base64Img}"
            });
        }

        [HttpPost("validate")]
        [IgnoreAntiforgeryToken]
        public IActionResult Validate([FromBody] CaptchaValidateDto dto)
        {
            if (!_memoryCache.TryGetValue($"captcha:{dto.CaptchaId}", out string expected))
            {
                return BadRequest("Captcha expired or not found");
            }

            _memoryCache.Remove($"captcha:{dto.CaptchaId}");

            if (expected?.Trim().ToUpper() == dto.Value?.Trim().ToUpper())
            {
                return Ok(new { valid = true });
            }

            return BadRequest(new { valid = false, error = "Invalid captcha" });
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
