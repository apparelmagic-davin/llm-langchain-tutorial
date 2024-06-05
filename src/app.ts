import {ChatOpenAI} from "@langchain/openai";
import * as dotenv from "dotenv";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";

dotenv.config();

async function main() {
  const model = new ChatOpenAI({model: "gpt-3.5-turbo"});

  console.log(model);

  const messages = [
    new SystemMessage("Translate the following from English into Italian"),
    new HumanMessage("You are very beautiful!"),
  ];

  const result = await model.invoke(messages);
  console.log(result);
}

main().catch(console.error);