import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

if (!process.env.OPENAI_ORG_ID) {
  throw new Error("OPENAI_ORG_ID is not set in environment variables");
}

// Initialize OpenAI client with API key and organization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!.trim(), // Trim to remove any whitespace
  organization: process.env.OPENAI_ORG_ID!.trim(),
});

type TextContent = {
  type: "text";
  text: string;
}

type ImageUrlContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "low" | "high" | "auto";
  };
}

type MessageContent = TextContent | ImageUrlContent;

export async function generateImageDescription(base64Image: string): Promise<string> {
  try {
    // Verify API key format
    const apiKey = process.env.OPENAI_API_KEY!.trim();
    if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
      throw new Error('Invalid API key format. Key should start with "sk-" and be at least 40 characters long.');
    }

    // Ensure the base64 string has the correct data URI prefix
    const base64WithPrefix = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    console.log('Generating description for image (base64)');
    console.log('Using organization:', process.env.OPENAI_ORG_ID);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in stock photography and image analysis. Your task is to:
1. Describe the main subject and composition of the image
2. Note key visual elements that make it suitable for stock photography
3. Identify potential commercial or editorial use cases
4. Highlight any unique or distinctive features
Keep descriptions professional, objective, and optimized for stock photography platforms.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide a detailed description suitable for stock photography. Focus on visual elements, composition, mood, and potential commercial applications. Keep the description concise but comprehensive.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64WithPrefix,
                detail: "high"
              }
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7, // Add some creativity while maintaining accuracy
    });

    const description = response.choices[0]?.message?.content;
    if (!description) {
      throw new Error("No description generated");
    }

    return description;
  } catch (error) {
    console.error("Error generating image description:", error);
    
    if (error instanceof Error) {
      // Enhanced error handling with more specific cases
      if (error.message.includes("Incorrect API key")) {
        console.error("API Key validation failed. Please check your OpenAI API key.");
        throw new Error("Invalid OpenAI API key. Please check your configuration.");
      } else if (error.message.includes("Rate limit")) {
        console.error("Rate limit hit. Consider implementing exponential backoff.");
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      } else if (error.message.includes("Organization")) {
        console.error("Organization validation failed. Please check your OpenAI organization ID.");
        throw new Error("Invalid OpenAI organization ID. Please check your configuration.");
      } else if (error.message.includes("model")) {
        console.error("Model error:", error.message);
        throw new Error("OpenAI model error. Please check model availability and permissions.");
      } else if (error.message.includes("invalid_request_error")) {
        console.error("Invalid request error:", error.message);
        throw new Error("Invalid request. Please check the image format.");
      } else if (error.message.includes("context_length_exceeded")) {
        console.error("Context length exceeded. The image may be too complex.");
        throw new Error("Image too complex. Try with a simpler image or lower detail setting.");
      } else if (error.message.includes("base64")) {
        console.error("Invalid base64 encoding:", error.message);
        throw new Error("Invalid image encoding. Please ensure the image is properly encoded in base64 format.");
      }
      throw error;
    }
    throw new Error("Failed to generate image description");
  }
}
