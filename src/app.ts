import {ChatOpenAI} from "@langchain/openai";
import * as dotenv from "dotenv";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {StringOutputParser} from "@langchain/core/output_parsers";
import {ChatPromptTemplate} from "@langchain/core/prompts";

dotenv.config();

async function main() {
  const model = new ChatOpenAI({model: "gpt-3.5-turbo"});

  const systemTemplate = "Translate the following into {language}:";

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "{text}"],
  ]);

  const parser = new StringOutputParser();

  const chain = promptTemplate.pipe(model).pipe(parser)

  const result = await chain.invoke({language: "spanish", text: "I am building a software system"});

  console.log(result);
}

main().catch(console.error);