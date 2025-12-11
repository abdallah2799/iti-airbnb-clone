using Core.DTOs;
namespace Infragentic.Interfaces
{
    public interface IAgenticContentGenerator
    {
        Task<List<string>> GenerateListingDescriptionsAsync(string propertyDetails);
        Task<string> AnswerQuestionWithRagAsync(string question, List<ChatMessageDto> history, string? userId = null);
    }
}