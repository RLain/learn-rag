/*
## Effective chunking:
- Ensure content is free from uncessary or irrelevant data

- Remove HTML tags, characters or symbols that can affect your embeddings

- Correct typos

- Remove any repeated text, and standardise your text formatting

## Choosing a chunk size

- Depends on the type of content: Short content vs large documents

- Consider the embedding model and its token limits

- User queries: Short and specific vs longer and more detailed

- Consider how you'll use the received text chunks

- Shorter chunks capture precise meanings but may miss wider context

- Longer chunks grasp more context, but can produce too broad of a scope of information and confuse the models

📚 Docs: https://docs.langchain.com/oss/python/integrations/splitters/index#length-based

LangChain has two different methods:

- CharacterTextSplitter
- RecursiveCharacterTextSplitter
*/

import { CharacterTextSplitter } from "langchain/text_splitter";

// LangChain text splitter
async function splitDocument() {
  const response = await fetch("podcasts.txt");
  const text = await response.text();

  const splitter = new CharacterTextSplitter({
    separator: " ",
    chunkSize: 150,
    chunkOverlap: 15,
  });
  const output = await splitter.createDocuments([text]);
  console.log(output);
}
splitDocument();

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// LangChain text splitter
async function splitDocument() {
  const response = await fetch("podcasts.txt");
  const text = await response.text();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 150,
    chunkOverlap: 15,
  });
  const output = await splitter.createDocuments([text]);
  console.log(output);
}
splitDocument();
