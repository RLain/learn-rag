import { openai, supabase } from "./config.js";

const query = "What gear do I need for BOS 400?";

main(query);

async function main(input) {
  const embedding = await createEmbedding(input);
  const match = await findNearestMatch(embedding);
  await getChatCompletion(match, input);
}

// Create an embedding vector representing the query
async function createEmbedding(input) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small", // must match the model used in challenge-rescue-chunking.js
    input,
  });
  return embeddingResponse.data[0].embedding;
}

// Query Supabase and return a semantically matching text chunk
async function findNearestMatch(embedding) {
  const { data, error } = await supabase.rpc("match_rescue", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 10,
  });
  if (error) throw error;

  // Manage multiple returned matches
  const match = data.map((obj) => obj.content).join("\n"); //And make sure the match content returns all results
  return match;
}

// Use OpenAI to make the response conversational
const chatMessages = [
  {
    role: "system",
    content:
      "You are a mountain rescue expert, who has historical context of gear requirements, area considerations and operation context for previous rescues. It is critical that the information shared is sourced accurately from our database only. Do not infer needs, never make up information, nor source information from external systems. Dilligence and accuracy is key",
  },
];

async function getChatCompletion(text, query) {
  chatMessages.push({
    role: "user",
    content: `Context: ${text} Question: ${query}`,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: chatMessages,
  });
  console.log(response.choices[0].message.content);
}
