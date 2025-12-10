namespace Infragentic.Interfaces
{
    public interface IAgenticContentGenerator
    {
        Task<List<string>> GenerateListingDescriptionsAsync(string propertyDetails);
        Task<string> AnswerQuestionWithRagAsync(string question,string? userId = null);
    }
}