import { openai, supabase } from "./config.js";
import rescueData from "./challenge-rescue-data.js";

// Each record is small and self-contained, so we embed one record per chunk
// instead of using a text splitter. Labelling every field keeps the location
// and year attached to the gear and area context in the same chunk.
function recordToChunk(record) {
  return [
    `Location: ${record.location} | Year: ${record.year} | Type: ${record.type}`,
    `Content: ${record.content}`,
    `Gear: ${record.gear}`,
    `Area context: ${record.area_context}`,
  ].join("\n");
}

/* Create an embedding from each record.
Store all embeddings and corresponding text in Supabase. */
async function createAndStoreEmbeddings() {
  const chunks = rescueData.map(recordToChunk);

  const results = await Promise.all(
    chunks.map(async (content) => {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small", // must match challenge-rescue-poc.js
        input: content,
        encoding_format: "float",
      });

      const { error } = await supabase.from("rescue").insert({
        content,
        embedding: embedding.data[0].embedding,
      });
      if (error) throw error;
      return content;
    }),
  );

  console.log(`Stored ${results.length} records.`);
}

createAndStoreEmbeddings();
