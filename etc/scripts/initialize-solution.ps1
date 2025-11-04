abp install-libs

cd src/SpaApp.DbMigrator && dotnet run && cd -


cd src/SpaApp.HttpApi.Host && dotnet dev-certs https -v -ep openiddict.pfx -p config.auth_server_default_pass_phrase 



exit 0