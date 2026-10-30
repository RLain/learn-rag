import { openai, supabase } from "./config.js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

/* Split movies.txt into text chunks.
Return LangChain's "output" – the array of Document objects. */
async function splitDocument(document) {
  try {
    const response = await fetch(document);
    // Check if fetch request was successful
    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const text = await response.text();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 250,
      chunkOverlap: 35,
    });
    const output = await splitter.createDocuments([text]);
    return output;
  } catch (e) {
    console.error("There was an issue with splitting text");
    throw e;
  }
}

/* Create an embedding from each text chunk.
Store all embeddings and corresponding text in Supabase. */
async function createAndStoreEmbeddings() {
  try {
    const chunkData = await splitDocument("movies.txt");
    const data = await Promise.all(
      chunkData.map(async (chunk) => {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk.pageContent,
        });
        return {
          content: chunk.pageContent,
          embedding: embeddingResponse.data[0].embedding,
        };
      }),
    );

    const { error } = await supabase.from("movies").insert(data);
    if (error) {
      throw new Error("Issue inserting data into the database.");
    }
    console.log("SUCCESS!");
  } catch (e) {
    console.error("ERROR: " + e.message);
  }
}
createAndStoreEmbeddings();
