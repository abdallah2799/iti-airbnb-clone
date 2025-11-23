using Application.DTOs;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services.Implementation
{
    public class UserProfileService : IUserProfileService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;
        private readonly IPhotoService _photoService;

        public UserProfileService(
            UserManager<ApplicationUser> userManager,
            IMapper mapper,
            IPhotoService photoService)
        {
            _userManager = userManager;
            _mapper = mapper;
            _photoService = photoService;
        }

        public async Task<ProfileDto> GetProfileAsync(string userId)
        {
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new InvalidOperationException("User not found");

            return _mapper.Map<ProfileDto>(user);
        }

        public async Task<ProfileDto> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            // Update basic profile information
            user.Bio = updateProfileDto.Bio;
            user.FullName = updateProfileDto.FullName;

            // Update email if provided and different
            if (!string.IsNullOrEmpty(updateProfileDto.Email) &&
                updateProfileDto.Email != user.Email)
            {
                var emailExists = await _userManager.FindByEmailAsync(updateProfileDto.Email);
                if (emailExists != null && emailExists.Id != userId)
                    throw new InvalidOperationException("Email is already taken");

                user.Email = updateProfileDto.Email;
                user.UserName = updateProfileDto.Email;
                user.NormalizedEmail = _userManager.NormalizeEmail(updateProfileDto.Email);
                user.NormalizedUserName = _userManager.NormalizeName(updateProfileDto.Email);
            }

            // Update phone number if provided
            if (updateProfileDto.PhoneNumber != user.PhoneNumber)
            {
                user.PhoneNumber = updateProfileDto.PhoneNumber;
                user.PhoneNumberVerified = false;
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to update profile: {errors}");
            }

            return _mapper.Map<ProfileDto>(user);
        }

        public async Task<string> UpdateProfilePictureAsync(string userId, IFormFile file)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            // Validate file
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file provided");

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                throw new InvalidOperationException("File size cannot exceed 5MB");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
                throw new InvalidOperationException("Only image files (JPG, PNG, GIF, WEBP) are allowed");

            // Upload photo using your photo service
            var photoUrl = await _photoService.UploadPhotoAsync(file);

            // Update user with new profile picture URL
            // Old profile picture URL will be automatically replaced
            user.ProfilePictureUrl = photoUrl;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                throw new InvalidOperationException("Failed to update profile picture");

            return photoUrl;
        }

        public async Task<bool> RemoveProfilePictureAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            // Simply set ProfilePictureUrl to null
            // We don't delete the actual photo file
            user.ProfilePictureUrl = null;
            var result = await _userManager.UpdateAsync(user);

            return result.Succeeded;
        }
    }
}
