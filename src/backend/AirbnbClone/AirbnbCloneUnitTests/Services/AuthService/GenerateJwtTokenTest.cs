using System.Security.Claims;
using FluentAssertions;
 

public class GenerateJwtTokenTest : AuthServiceTestBase
{

    [Fact]
    public async Task GenerateJwtToken_ShouldContainCorrectClaimsAndRoles()
    {
        
        var tokenString = await _authService.GenerateJwtToken(_testUser);

        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = tokenHandler.ReadJwtToken(tokenString);

        
        token.Claims.Should().Contain(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub && c.Value == _testUser.Id);
        token.Claims.Should().Contain(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email && c.Value == _testUser.Email);
        
        
        var roleClaims = token.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        
        roleClaims.Should().HaveCount(_testRoles.Count);
        roleClaims.Select(c => c.Value).Should().Contain(_testRoles);
    }

    [Fact]
    public async Task GenerateJwtToken_ShouldThrowException_WhenKeyIsNotConfigured()
    {
        
        _configMock.SetupGet(c => c["Jwt:Key"]).Returns((string)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _authService.GenerateJwtToken(_testUser)
        );
    }

    [Fact]
    public async Task GenerateJwtToken_ShouldThrowException_WhenIssuerIsNotConfigured()
    {
        
        _configMock.SetupGet(c => c["Jwt:Issuer"]).Returns((string)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _authService.GenerateJwtToken(_testUser)
        );
    }

    [Fact]
    public async Task GenerateJwtToken_ShouldThrowException_WhenAudienceIsNotConfigured()
    {
        
        _configMock.SetupGet(c => c["Jwt:Audience"]).Returns((string)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _authService.GenerateJwtToken(_testUser)
        );
    }

    [Fact]
    public async Task GenerateJwtToken_ShouldSetExpiryBasedOnConfiguration()
    {
        
        _configMock.SetupGet(c => c["Jwt:ExpiryInMinutes"]).Returns("120");

        
        var tokenString = await _authService.GenerateJwtToken(_testUser);

        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = tokenHandler.ReadJwtToken(tokenString);

        
        var expectedExpiry = DateTime.UtcNow.AddMinutes(120);
        token.ValidTo.Should().BeCloseTo(expectedExpiry, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task GenerateJwtToken_ShouldThrowException_WhenUserIsNull()
    {
        
        await Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _authService.GenerateJwtToken(null)
        );
    }
}
