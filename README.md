## Learn RAG

Scrimba's "Learn RAG" course by Guil Hernandez

🔗 https://scrimba.com/learn-rag-c033

## 🔢 What to expect

- Embedding basics
- Creating embeddings with the OpenAI API
- Intro into vector databases
- Set up and use a vector database
- AI-drive search and conversations
- AI development framework Langchain

## 🗣️ Useful terms

- `RAG` = Retrieval-Augmented Generation in artificial intelligenc

- `Lexical` search is a traditional information retrieval method that finds documents by matching the exact words or phrases entered by the user to the text in a database.
  - It has high precision and excels at finding exact product IDs, serial numbers, error codes, legal citations, or specific proper names.
  - Has no synonym awareness and treats words strictly by their form, meaning a search for "car" will miss documents that only use "automobile" or "vehicle" unless custom synonym rules are built-in

- `Semantic search` is an information retrieval technique that focuses on understanding the contextual meaning, intent, and relationships behind a user's query rather than just matching literal keywords

- `cosine similarity` is a measure of similarity between two non-zero vectors in an inner product space, calculated as the cosine of the angle between them. This is the formula used under the hood for semantic search. We don't need to worry about this and various tools handle the formula e.g. [Supabase Query](https://supabase.com/docs/guides/ai/vector-columns#querying-a-vector--embedding) ergo

```sql
--Supabase client libraries like supabase-js connect to your Postgres instance via PostgREST. PostgREST does not currently support pgvector similarity operators, so we'll need to wrap our query in a Postgres function and call it via the rpc() method.

-- This function takes a query_embedding argument and compares it to all other embeddings in the documents table. Each comparison returns a similarity score. If the similarity is greater than the match_threshold argument, it is returned. The number of rows returned is limited by the match_count argument.
create or replace function match_documents (
  query_embedding extensions.vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  body text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.title,
    documents.body,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by (documents.embedding <=> query_embedding) asc
  limit match_count;
$$;

--To execute the function from your client library, call rpc() with the name of your Postgres function:

const { data: documents } = await supabaseClient.rpc('match_documents', {
  query_embedding: embedding, // Pass the embedding you want to compare
  match_threshold: 0.78, // Choose an appropriate threshold for your data
  match_count: 10, // Choose the number of matches
})

-- Example of an output from rpc() using this query for the embedding model = "Jammin' in the Big Easy";
[{id: 2, content: 'Jazz under stars (55 min): Experience a captivating night in New Orleans, where jazz melodies echo under the moonlit sky.', similarity: 0.846583600073963}]

-- Another example  using the query of "Orca songs"
Songs of the Sea (1 hr): Dive deep with marine biologists to understand the intricate whale songs echoing in our vast oceans. 0.816175652996512

-- A third example, using the query "What can I listen to in half an hour?"
-- Note how this doesn't match any of the words, but semtantically matches! Half an hour is 30 minutes.
The soundscape of silence (30 min): Traverse the globe with sonic explorers to find the world's most serene and silent spots. 0.799330449224047
```

- In Supabase, `rpc()` is used to call PostgreSQL `Remote Procedure Calls` (stored procedures or functions) directly from your database

Operator | Description
<-> Euclidean distance
<#> negative inner product
<=> cosine distance

- `Euclidean distance` is the straight-line length between two points in Euclidean space, calculated using the Pythagorean theorem.
- `cosine distance` measures the dissimilarity between two non-zero vectors by subtracting their cosine similarity from 1.

## 📚 Additional reading

- https://developers.openai.com/api/docs/guides/embeddings
- Supabase pgvector https://supabase.com/blog/openai-embeddings-postgres-vector
- Supabase rpc() method https://supabase.com/docs/guides/ai/vector-columns#querying-a-vector--embedding

## Chunking context

Each chunk becomes one row: its text plus one embedding vector computed from that text alone. The database has no "this came after that" or "same document as" information. When you search, the query is embedded and compared against each chunk's vector independently, and the closest chunks come back.

What overlap does

Overlap is not a link between chunks. It just repeats the last few characters of one chunk at the start of the next. The point is to avoid cutting a sentence in half at a boundary, so the idea survives in at least one chunk. `Chunk 2 doesn't know chunk 1 exists`. It happens to contain some of the same words.

Your bug is this problem

Your 150-character chunks cut each record into pieces, roughly like this:

- Chunk A: location: BOS 400, year: 2026, type: MSCA, content: We made a quick call...
- Chunk B: gear: 100m ropes required to lower down cliff face...

Chunk B has the gear info but never mentions "BOS 400". A query for "gear for BOS 400" matches chunk A well, which has no gear, and chunk B poorly. The model then only sees the chunks that got retrieved, so it said it had no gear list. Raising match_count to 10 worked because chunk B finally made it into the results.

How people solve it

- Keep related facts in one chunk. For structured data like yours, `one chunk per record is often best`. Your records are small enough.
- Put identifying context in every chunk. For example, prefix each chunk with BOS 400 (2026):, so every piece matches queries about that location.
- Store metadata. Add columns like location or source_id on each row. You can then fetch sibling chunks with the same id, or filter by location.
- Retrieve more, or add neighbours. Return more chunks (as I did), or fetch the chunks before and after each match. This needs the ordering stored as metadata.
- Use larger chunks. Bigger chunks keep more context together, but each embedding gets blurrier and the search less precise.

The query doesn't need to match text inside the chunk exactly. Embeddings match by meaning, not keywords. But the chunk's own text is all the model has to match against.

For your data, I'd store one chunk per record. The real question is whether to split each record by field, and for records this size I'd say no.

Why one chunk per record works here

- Each record is a single coherent unit: one operation, with its gear, area notes and outcome. Users will ask things like "what do I need for BOS 400?", which spans several fields.
- Your longest record is roughly 900 characters, about 200 tokens. That's well within the comfortable range for one embedding.
- It avoids the bug you just hit, where the gear sat in a different chunk from the location name.

When to split by field

Split only if a field gets long enough to dilute the embedding, or if queries target one field in isolation. If you do split:

- Repeat the identifiers in every chunk. For example, BOS 400 (2026, MSCA) – Gear: ... and BOS 400 (2026, MSCA) – Area context: ....
- Keep the metadata on each row. Store location, year and type as columns, so you can filter or fetch all chunks for one operation.

Without those two things, field chunks are isolated, as I described earlier.

A good format for a record chunk

Label the fields so the embedding captures what each part means:

Location: Bos 400 | Year: 2026 | Type: MSCA
Content: We made a quick call...
Gear: 100m ropes required...
Area context: The XXX Road...

That's close to what challenge-rescue-chunking.js already builds. The difference is that you'd skip the splitter and embed each record whole.

Is there an ideal chunk size?

There's no single number, but these rules of thumb hold:

- Hard limit: text-embedding-3-small accepts up to 8,191 tokens, so you're nowhere near it.
- Typical range: about 200–500 tokens (roughly 800–2,000 characters) for general prose. Small chunks of 100–150 characters like your current ones are usually too small. They lose context.
- Trade-off: small chunks give precise matches but little context. Large chunks give more context, but each embedding blends several topics, so matching gets fuzzier.
- Overlap: commonly 10–20% of the chunk size, and only useful for continuous prose. For structured records you can use none.

`Splitters like RecursiveCharacterTextSplitter are for long unstructured documents`.

`For a JSON list of records, skip the splitter and embed each record directly. It's simpler and works better.`
