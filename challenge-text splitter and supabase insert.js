// My attempt

import { openai, supabase } from "./config.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/*
  Challenge: Text Splitters, Embeddings, and Vector Databases!
    1. Use LangChain to split the content in movies.txt into smaller chunks.
    2. Use OpenAI's Embedding model to create an embedding for each chunk.
    3. Insert all text chunks and their corresponding embedding
       into a Supabase database table.
 */

/* Split movies.txt into text chunks.
Return LangChain's "output" – the array of Document objects. */
async function splitDocument(document) {
  const testSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 0,
  });
  return testSplitter.createDocuments([document]);
}

/* Create an embedding from each text chunk.
Store all embeddings and corresponding text in Supabase. */
async function createAndStoreEmbeddings() {
  const response = await fetch("movies.txt");
  const moviesDocument = await response.text();

  const chunkData = await splitDocument(moviesDocument);

  const embeddings = await Promise.all(
    chunkData.map(async (chunk) => {
      const content = chunk.pageContent;
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
        encoding_format: "float",
      });

      return await supabase.from("documents").insert({
        content: content,
        embedding: embedding.data[0].embedding,
      });
    }),
  );

  console.log(embeddings[0]);
}

createAndStoreEmbeddings();

// Lecturers approach
