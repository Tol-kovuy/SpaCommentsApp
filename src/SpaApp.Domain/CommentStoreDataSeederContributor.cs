using SpaApp.Books;
using SpaApp.Comments;
using System;
using System.Threading.Tasks;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;

namespace SpaApp;

public class SpaAppDataSeederContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IRepository<Comment, Guid> _commentRepository;

    public SpaAppDataSeederContributor(IRepository<Comment, Guid> commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        if (await _commentRepository.GetCountAsync() <= 0)
        {
            var comment1 = new Comment
            {
                UserName = "JohnDoe",
                Email = "john@example.com",
                Homepage = "https://example.com",
                Text = "Это мой первый комментарий!",
                FilePath = null,
                FileType = null,
                CreationTime = DateTime.Now
            };

            var comment2 = new Comment
            {
                UserName = "JaneSmith",
                Email = "jane@example.com",
                Homepage = null,
                Text = "А это ответ на первый комментарий :)",
                Parent = comment1,
                FilePath = null,
                FileType = null,
                CreationTime = DateTime.Now
            };

            await _commentRepository.InsertAsync(comment1, autoSave: true);
            await _commentRepository.InsertAsync(comment2, autoSave: true);
        }
    }
}
