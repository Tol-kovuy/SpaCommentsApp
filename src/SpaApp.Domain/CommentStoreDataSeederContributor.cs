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
                UserName = "ghjgh",
                Email = "ghj@ghj.com",
                Homepage = "",
                Text = "first comment!",
                CreationTime = DateTime.Now
            };

            var comment2 = new Comment
            {
                UserName = "ghj",
                Email = "ghjg@ghjghj.com",
                Homepage = null,
                Text = "answer by first comt",
                Parent = comment1,
                CreationTime = DateTime.Now
            };

            await _commentRepository.InsertAsync(comment1, autoSave: true);
            await _commentRepository.InsertAsync(comment2, autoSave: true);
        }
    }
}
