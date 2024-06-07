import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { END, MessageGraph } from "@langchain/langgraph";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ToolMessage } from "@langchain/core/messages";
import { Calculator } from 'langchain/tools/calculator';
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";

dotenv.config();

async function main() {
  const model = new ChatOpenAI({
    temperature: 0,
  }).bind({
    tools: [convertToOpenAITool(new Calculator())],
    tool_choice: "auto",
  });

  const graph = new MessageGraph();

  graph.addNode("oracle", async (state: BaseMessage[]) => {
    return model.invoke(state);
  });

  graph.addNode("calculator", async (state: BaseMessage[]) => {
    const tool = new Calculator();
    const toolCalls =
      state[state.length - 1].additional_kwargs.tool_calls ?? [];
    const calculatorCall = toolCalls.find(
      (toolCall) => toolCall.function.name === "calculator",
    );
    if (calculatorCall === undefined) {
      throw new Error("No calculator input found.");
    }
    const result = await tool.invoke(
      JSON.parse(calculatorCall.function.arguments),
    );
    return new ToolMessage({
      tool_call_id: calculatorCall.id,
      content: result,
    });
  });

  graph.addEdge("calculator", END);

  graph.setEntryPoint("oracle");

  console.log(res);
}

main().catch(console.error);
