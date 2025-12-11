using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.DTOs
{
    public class ChatRequest
    {
        public string Question { get; set; } = string.Empty;
        // New: The frontend sends the conversation history
        public List<ChatMessageDto> History { get; set; } = new();
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } = "user"; // "user" or "assistant"
        public string Content { get; set; } = string.Empty;
    }
}
