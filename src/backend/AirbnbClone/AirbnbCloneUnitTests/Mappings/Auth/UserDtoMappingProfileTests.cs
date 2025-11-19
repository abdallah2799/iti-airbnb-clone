using AutoMapper;
using Xunit;
using AirbnbClone.Application.Helpers;
using Application.DTOs;
using Core.Entities;

public class UserDtoMappingProfileTests
{
    [Fact]
    public void UserDto_MapsTo_UserEntity_Correctly()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<UserMappingProfile>());
        var mapper = config.CreateMapper();
        var dto = new UserDto {  };

        var entity = mapper.Map<ApplicationUser>(dto);

        Assert.Equal(dto.Id, entity.Id);
        Assert.Equal(dto.Email, entity.Email);
    }
}
