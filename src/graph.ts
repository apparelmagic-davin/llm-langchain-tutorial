import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { END, MessageGraph, StateGraph } from "@langchain/langgraph";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ToolMessage } from "@langchain/core/messages";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ToolExecutor } from "@langchain/langgraph/prebuilt";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { FunctionMessage } from "@langchain/core/messages";
import { AgentAction } from "@langchain/core/agents";
import util from 'util'

dotenv.config();

async function main() {
  // const model = new ChatOpenAI({
  //   temperature: 0,
  // }).bind({
  //   tools: [convertToOpenAITool(new Calculator())],
  //   tool_choice: "auto",
  // });
  //
  // const graph = new MessageGraph();
  //
  // graph.addNode("oracle", async (state: BaseMessage[]) => {
  //   return model.invoke(state);
  // });
  //
  // graph.addNode("calculator", async (state: BaseMessage[]) => {
  //   const tool = new Calculator();
  //   const toolCalls =
  //     state[state.length - 1].additional_kwargs.tool_calls ?? [];
  //   const calculatorCall = toolCalls.find(
  //     (toolCall) => toolCall.function.name === "calculator",
  //   );
  //   if (calculatorCall === undefined) {
  //     throw new Error("No calculator input found.");
  //   }
  //   const result = await tool.invoke(
  //     JSON.parse(calculatorCall.function.arguments),
  //   );
  //   return new ToolMessage({
  //     tool_call_id: calculatorCall.id,
  //     content: result,
  //   });
  // });
  //
  // graph.addEdge("calculator", END);
  //
  // graph.setEntryPoint("oracle");
  //
  // console.log(res);
  
  const tools = [new TavilySearchResults({ maxResults: 1 })];

  const toolExecutor = new ToolExecutor({ tools });

  const model = new ChatOpenAI({
    temperature: 0,
    streaming: true,
  });

  const toolsAsOpenAIFunctions = tools.map((tool) =>
    convertToOpenAIFunction(tool),
  );
  const newModel = model.bind({
    functions: toolsAsOpenAIFunctions,
  });

  const agentState = {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  };

  // Define the function that determines whether to continue or not
  const shouldContinue = (state: { messages: Array<BaseMessage> }) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    // If there is no function call, then we finish
    if (
      !("function_call" in lastMessage.additional_kwargs) ||
      !lastMessage.additional_kwargs.function_call
    ) {
      return "end";
    }
    // Otherwise if there is, we continue
    return "continue";
  };

  // Define the function to execute tools
  const _getAction = (state: { messages: Array<BaseMessage> }): AgentAction => {
    const { messages } = state;
    // Based on the continue condition
    // we know the last message involves a function call
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error("No messages found.");
    }
    if (!lastMessage.additional_kwargs.function_call) {
      throw new Error("No function call found in message.");
    }
    // We construct an AgentAction from the function_call
    return {
      tool: lastMessage.additional_kwargs.function_call.name,
      toolInput: JSON.parse(
        lastMessage.additional_kwargs.function_call.arguments,
      ),
      log: "",
    };
  };

  // Define the function that calls the model
  const callModel = async (state: { messages: Array<BaseMessage> }) => {
    const { messages } = state;
    // You can use a prompt here to tweak model behavior.
    // You can also just pass messages to the model directly.
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant."],
      new MessagesPlaceholder("messages"),
    ]);
    const response = await prompt.pipe(newModel).invoke({ messages });
    // We return a list, because this will get added to the existing list
    return {
      messages: [response],
    };
  };

  const callTool = async (state: { messages: Array<BaseMessage> }) => {
    const action = _getAction(state);
    // We call the tool_executor and get back a response
    const response = await toolExecutor.invoke(action);
    // We use the response to create a FunctionMessage
    const functionMessage = new FunctionMessage({
      content: response,
      name: action.tool,
    });
    // We return a list, because this will get added to the existing list
    return { messages: [functionMessage] };
  };

  // Define a new graph
  const workflow = new StateGraph({
    channels: agentState,
  });

  // Define the two nodes we will cycle between
  workflow.addNode("agent", callModel);
  workflow.addNode("action", callTool);

  // Set the entrypoint as `agent`
  // This means that this node is the first one called
  workflow.setEntryPoint("agent");

  // We now add a conditional edge
  workflow.addConditionalEdges(
    // First, we define the start node. We use `agent`.
    // This means these are the edges taken after the `agent` node is called.
    "agent",
    // Next, we pass in the function that will determine which node is called next.
    shouldContinue,
    // Finally we pass in a mapping.
    // The keys are strings, and the values are other nodes.
    // END is a special node marking that the graph should finish.
    // What will happen is we will call `should_continue`, and then the output of that
    // will be matched against the keys in this mapping.
    // Based on which one it matches, that node will then be called.
    {
      // If `tools`, then we call the tool node.
      continue: "action",
      // Otherwise we finish.
      end: END,
    },
  );

  // We now add a normal edge from `tools` to `agent`.
  // This means that after `tools` is called, `agent` node is called next.
  workflow.addEdge("action", "agent");

  // Finally, we compile it!
  // This compiles it into a LangChain Runnable,
  // meaning you can use it as you would any other runnable
  const app = workflow.compile();

  const inputs = {
    messages: [new HumanMessage("what is the weather in sf")],
  };
  for await (const output of await app.stream(inputs)) {
    console.log("output", util.inspect(output, { showHidden: false, depth: null, colors: true }));
    console.log("-----\n");
  }
}

main().catch(console.error);
