import { openai, supabase } from "./config.js";

// Query about our movie data
const query = "Film recommendations for Batman Begin fans";

main(query);

async function main(input) {
  const embedding = await createEmbedding(input);
  const match = await findNearestMatch(embedding);
  await getChatCompletion(match, input);
}

// Create an embedding vector representing the query
async function createEmbedding(input) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
  });
  return embeddingResponse.data[0].embedding;
}

/*
  Challenge: Return and manage multiple matches
    - Return at least 3 matches from the database table
    - Combine all of the matching text into 1 string
*/

// Query Supabase and return a semantically matching text chunk
async function findNearestMatch(embedding) {
  const { data } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 4, //Simply update this!
  });

  // Manage multiple returned matches
  const match = data.map((obj) => obj.content).join("\n"); //And make sure the match content returns all results
  return match;
}

// Use OpenAI to make the response conversational
const chatMessages = [
  {
    role: "system",
    content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.`,
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
