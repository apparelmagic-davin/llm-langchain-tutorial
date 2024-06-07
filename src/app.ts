import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { calculatorTool } from "./calculatorTool";
import { AIMessageChunk } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";

dotenv.config();

async function main() {
  // const model = new ChatOpenAI({
  //   model: "gpt-3.5-turbo",
  //   temperature: 0,
  // });

  // const systemTemplate = "Translate the following into {language}:";
  //
  // const promptTemplate = ChatPromptTemplate.fromMessages([
  //   ["system", systemTemplate],
  //   ["user", "{text}"],
  // ]);
  //
  // const parser = new StringOutputParser();
  //
  // const chain = promptTemplate.pipe(model).pipe(parser);
  //
  // const result = await chain.invoke({
  //   language: "spanish",
  //   text: "I am building a software system",
  // });
  //
  // console.log(result);

  // const llmWithTools = model.bindTools([calculatorTool]);
  //
  // const res = await llmWithTools.invoke([
  //   new HumanMessage("What is 333382 🦜 1932?"),
  //   new AIMessage({
  //     content: "",
  //     tool_calls: [
  //       {
  //         id: "12345",
  //         name: "calculator",
  //         args: {
  //           number1: 333382,
  //           number2: 1932,
  //           operation: "divide",
  //         },
  //       },
  //     ],
  //   }),
  //   new ToolMessage({
  //     tool_call_id: "12345",
  //     content: "The answer is 172.558.",
  //   }),
  //   new AIMessage("The answer is 172.558."),
  //   new HumanMessage("What is 3 🦜 12"),
  // ]);
  // console.log(res.tool_calls);

  const model = new ChatOpenAI({ model: "gpt-3.5-turbo" });

  const tool = new WikipediaQueryRun({
    topKResults: 1,
    maxDocContentLength: 100,
  });

  const res = await tool.invoke({ input: "langchain" })

  console.log(res)

  // const modelWithTools = model.bind({
  //   tools: [
  //     {
  //       type: "function",
  //       function: {
  //         name: "calculator",
  //         description: "Can perform mathematical operations.",
  //         parameters: {
  //           type: "object",
  //           properties: {
  //             operation: {
  //               type: "string",
  //               description: "The type of operation to execute.",
  //               enum: ["add", "subtract", "multiply", "divide"],
  //             },
  //             number1: { type: "number", description: "First integer" },
  //             number2: { type: "number", description: "Second integer" },
  //           },
  //           required: ["number1", "number2"],
  //         },
  //       },
  //     },
  //   ],
  // });
  //
  // const res = await modelWithTools.invoke(`Whats 119 times 8?`);

  // console.log(res.tool_calls, res.lc_kwargs.tool_calls);
}

main().catch(console.error);
