using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using Application.Services.Interfaces; 
using Application.Services.Implementation; 
using Core.Entities;    
using Microsoft.Extensions.Options;     
using Microsoft.Extensions.Logging;
using Infrastructure.Repositories;

public class AuthServiceTestBase
{
    protected readonly Mock<IConfiguration> _configMock;
    protected readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    protected readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    protected readonly Mock<IEmailService> _emailServiceMock; 
    protected readonly Mock<RoleManager<IdentityRole>> _roleManagerMock; 
    protected readonly Mock<IUnitOfWork> _unitOfWorkMock = new Mock<IUnitOfWork>();
    protected readonly AuthService _authService;
    
    
    protected readonly ApplicationUser _testUser = new ApplicationUser
    {
        Id = "test-user-id-123",
        Email = "test@example.com",
        UserName = "TestUser"
    };
    protected readonly List<string> _testRoles = new List<string> { "Host", "Guest" };

    public AuthServiceTestBase()
    {
        
        _configMock = new Mock<IConfiguration>();
        _configMock.SetupGet(c => c["Jwt:Key"]).Returns("ThisIsTheSuperSecretKeyForTesting12345");
        _configMock.SetupGet(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        _configMock.SetupGet(c => c["Jwt:Audience"]).Returns("TestAudience");
        _configMock.SetupGet(c => c["Jwt:ExpiryInMinutes"]).Returns("60");

        
        var userStore = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStore.Object, null, null, null, null, null, null, null, null);
        _userManagerMock
            .Setup(m => m.GetRolesAsync(_testUser))
            .ReturnsAsync(_testRoles);
        
        
        var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        var optionsAccessor = new Mock<IOptions<IdentityOptions>>();
        var loggerSignIn = new Mock<ILogger<SignInManager<ApplicationUser>>>();
        var authScheme = new Mock<Microsoft.AspNetCore.Authentication.IAuthenticationSchemeProvider>();
        var userConfirmation = new Mock<IUserConfirmation<ApplicationUser>>(); 
        
        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object, 
            contextAccessor.Object, 
            claimsFactory.Object, 
            optionsAccessor.Object, 
            loggerSignIn.Object, 
            authScheme.Object, 
            userConfirmation.Object);

        
         var roleStore = new Mock<IRoleStore<IdentityRole>>();
        var loggerRole = new Mock<ILogger<RoleManager<IdentityRole>>>();
        var normalizerMock = new Mock<ILookupNormalizer>();
        var identityErrorDescriber = new IdentityErrorDescriber();
        
        _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
            roleStore.Object, 
            null,
            normalizerMock.Object, 
            identityErrorDescriber, 
            loggerRole.Object 
        );

        
        _emailServiceMock = new Mock<IEmailService>();

        
        _authService = new AuthService(
            _userManagerMock.Object, 
            _signInManagerMock.Object, 
            _configMock.Object, 
            _emailServiceMock.Object, 
            _roleManagerMock.Object,
            _unitOfWorkMock.Object
        );
    }
}