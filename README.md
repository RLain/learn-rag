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
