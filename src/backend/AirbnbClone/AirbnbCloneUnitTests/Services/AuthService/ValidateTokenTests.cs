using System.Security.Claims;
using FluentAssertions;
using Moq;
using Xunit;

public class ValidateTokenTests : AuthServiceTestBase
{
    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnUserId_WhenTokenIsValid()
    {
        
        var validToken = await _authService.GenerateJwtToken(_testUser);

        
        var returnedUserId = await _authService.ValidateTokenAsync(validToken);

        
        returnedUserId.Should().NotBeNull();
        returnedUserId.Should().Be(_testUser.Id);
    }
    
    
    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnNull_WhenTokenIsInvalid()
    {
        
        var invalidToken = "invalid.token.signature"; 

        
        var returnedUserId = await _authService.ValidateTokenAsync(invalidToken);

        
        returnedUserId.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnNull_WhenTokenIsExpired()
    {
        
        _configMock.SetupGet(c => c["Jwt:ExpiryInMinutes"]).Returns("0");

        
        var expiredToken = await _authService.GenerateJwtToken(_testUser);

        
        var returnedUserId = await _authService.ValidateTokenAsync(expiredToken);

        
        returnedUserId.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnNull_WhenTokenHasInvalidIssuer()
    {
        
        var validToken = await _authService.GenerateJwtToken(_testUser);

        
        _configMock.SetupGet(c => c["Jwt:Issuer"]).Returns("InvalidIssuer");

        
        var returnedUserId = await _authService.ValidateTokenAsync(validToken);

        _configMock.VerifyGet(c => c["Jwt:Issuer"], Times.AtMost(2));

        returnedUserId.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnNull_WhenTokenHasInvalidAudience()
    {
        
        var validToken = await _authService.GenerateJwtToken(_testUser);

        
        _configMock.SetupGet(c => c["Jwt:Audience"]).Returns("InvalidAudience");

        
        var returnedUserId = await _authService.ValidateTokenAsync(validToken);

        
        returnedUserId.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnNull_WhenTokenIsNullOrEmpty()
    {
        
        var returnedUserIdForNull = await _authService.ValidateTokenAsync(null);
        var returnedUserIdForEmpty = await _authService.ValidateTokenAsync(string.Empty);

        
        returnedUserIdForNull.Should().BeNull();
        returnedUserIdForEmpty.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldReturnNull_WhenTokenIsMalformed()
    {
        
        var malformedToken = "malformed.token";

        
        var returnedUserId = await _authService.ValidateTokenAsync(malformedToken);

        
        returnedUserId.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldThrowExeption_WhenKeyIsNotConfigured()
    {
        
        var validToken = await _authService.GenerateJwtToken(_testUser);

        
        _configMock.SetupGet(c => c["Jwt:Key"]).Returns((string)null);

        
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _authService.ValidateTokenAsync(validToken)
        );
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldThrowExeption_WhenIssuerIsNotConfigured()
    {
        
        var validToken = await _authService.GenerateJwtToken(_testUser);

        
        _configMock.SetupGet(c => c["Jwt:Issuer"]).Returns((string)null);

        
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _authService.ValidateTokenAsync(validToken)
        );
    }

    [Fact]
    public async Task ValidateTokenAsync_ShouldThrowExeption_WhenAudienceIsNotConfigured()
    {
        
        var validToken = await _authService.GenerateJwtToken(_testUser);

        
        _configMock.SetupGet(c => c["Jwt:Audience"]).Returns((string)null);

        
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _authService.ValidateTokenAsync(validToken)
        );
    }

}
