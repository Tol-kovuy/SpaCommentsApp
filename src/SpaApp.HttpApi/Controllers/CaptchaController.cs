using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SpaApp.Comments.Dtos;
using System;
using System.Text;
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
        [AllowAnonymous]
        public IActionResult Get()
        {
            string captchaText = RandomString(6);
            var captchaId = Guid.NewGuid().ToString();
            _memoryCache.Set($"captcha:{captchaId}", captchaText, TimeSpan.FromMinutes(10));

            string svgImage = GenerateSvgCaptcha(captchaText);
            string base64Svg = Convert.ToBase64String(Encoding.UTF8.GetBytes(svgImage));

            return Ok(new CaptchaResponseDto
            {
                CaptchaId = captchaId,
                Image = $"data:image/svg+xml;base64,{base64Svg}"
            });
        }

        [HttpPost("validate")]
        [IgnoreAntiforgeryToken]
        [AllowAnonymous]
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

        private string GenerateSvgCaptcha(string text)
        {
            var svg = new StringBuilder();
            svg.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>");
            svg.AppendLine("<svg width=\"120\" height=\"40\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">");

            svg.AppendLine("<rect width=\"120\" height=\"40\" fill=\"white\" stroke=\"black\" stroke-width=\"1\"/>");

            for (int i = 0; i < 50; i++)
            {
                int x = random.Next(120);
                int y = random.Next(40);
                svg.AppendLine($"<circle cx=\"{x}\" cy=\"{y}\" r=\"1\" fill=\"#cccccc\"/>");
            }

            for (int i = 0; i < 5; i++)
            {
                int x1 = random.Next(120);
                int y1 = random.Next(40);
                int x2 = random.Next(120);
                int y2 = random.Next(40);
                svg.AppendLine($"<line x1=\"{x1}\" y1=\"{y1}\" x2=\"{x2}\" y2=\"{y2}\" stroke=\"#eeeeee\" stroke-width=\"1\"/>");
            }

            int xPos = 10;
            foreach (char c in text)
            {
                int yOffset = random.Next(-3, 3);
                int rotation = random.Next(-10, 10);
                string color = $"rgb({random.Next(50, 150)},{random.Next(50, 150)},{random.Next(50, 150)})";

                svg.AppendLine($"<text x=\"{xPos}\" y=\"{25 + yOffset}\" " +
                              $"transform=\"rotate({rotation} {xPos} {25 + yOffset})\" " +
                              $"font-family=\"Arial\" font-size=\"20\" font-weight=\"bold\" fill=\"{color}\">{c}</text>");
                xPos += 18;
            }

            svg.AppendLine("</svg>");
            return svg.ToString();
        }
    }
}