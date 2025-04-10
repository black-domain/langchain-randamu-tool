import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { encrypt, TimelockEncrypt } from "../tools/TimelockEncrypt";
import { TimelockDecrypt } from "../tools/TimelockDecrypt";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { getConfig } from "../../../config";

const config = getConfig();
const OPENAI_API_KEY = config.OPENAI_API_KEY;
const OPENAI_MODEL = config.OPENAI_MODEL;
const OPENAI_BASE_URL = config.OPENAI_BASE_URL;
const TAVILY_API_KEY = config.TAVILY_API_KEY;
let globalAgent: any = null;
let globalThoughtRecorder: ThoughtRecorderHandler | null = null;
let globalMemory: ConversationSummaryBufferMemory | null = null;

class ThoughtRecorderHandler extends BaseCallbackHandler {
  name = "ThoughtRecorderHandler";
  thoughts: string[] = [];
  toolCalls: any[] = [];
  currentThought: string = "";

  constructor() {
    super();
  }

  resetThoughts() {
    this.thoughts = [];
    this.currentThought = "";
  }

  // async handleAgentAction(action: any) {
  //   const tool = action.tool;
  //   const input = action.toolInput;
  //   const otherLog = action.log.split("Action:");
  //   if (otherLog.length <= 1) return;
  //   const log = otherLog[0].trim();
  //   if (log.startsWith("Question:")) {
  //     const arr = log.split("Thought:");
  //     // this.thoughts.push(arr[0].trim());
  //     this.thoughts.push(arr[1].trim());
  //   } else {
  //     if (!this.thoughts.includes(log)) {
  //       this.thoughts.push(log);
  //     }
  //   }
  //   this.toolCalls.push({ tool, input });
  //   return;
  // }
  async handleLLMEnd(output: any) {
    const llm_log = output?.generations[0][0]?.text;

    const thought_log = llm_log.split("Action:");
    if (thought_log.length <= 1) return;
    const generat_text = thought_log[0].trim();
    if (generat_text.includes("Thought:")) {
      if (generat_text.startsWith("Question:")) {
        const arr = generat_text.split("Thought:");
        this.thoughts.push(arr[0].trim());
        this.thoughts.push(arr[1].trim());
      } else {
        this.thoughts.push(generat_text[0].trim());
      }
    }
  }

  getThoughts() {
    return this.thoughts;
  }
}

export const initLangChain = async () => {
  if (globalAgent && globalThoughtRecorder && globalMemory) {
    return { agent: globalAgent, thoughtRecorder: globalThoughtRecorder };
  }

  const thoughtRecorder = new ThoughtRecorderHandler();
  globalThoughtRecorder = thoughtRecorder;

  const model = new ChatOpenAI({
    temperature: 0,
    model: OPENAI_MODEL,
    apiKey: OPENAI_API_KEY,
    configuration: {
      baseURL: OPENAI_BASE_URL,
    },
    streaming: true,
    callbacks: [thoughtRecorder],
  });
  const memory = new ConversationSummaryBufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input",
    maxTokenLimit: 1000,
    llm: model,
  });
  globalMemory = memory;
  const tarvily_search_tool = new TavilySearchResults({
    maxResults: 1,
    apiKey: TAVILY_API_KEY,
  });
  const tools = [
    new TimelockEncrypt(),
    new TimelockDecrypt(),
    tarvily_search_tool,
  ];
  const agent = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: true,
    callbacks: [thoughtRecorder],
    memory: memory,
    maxIterations: 3,
    agentArgs: {
      prefix: `
Strictly enforce the follow rules:
Rule 1. If you obtain the 'timelock-decrypt' tool execution result, you must output the result directly as the final answer. The output format is 'The result is: {{action result}}'. Do not perform any further actions, such as interpreting the decrypted result or passing it to any other tools.
`,
    },
  });
  globalAgent = agent;
  return { agent, thoughtRecorder };
};

export const initializeLangChainOnLoad = async () => {
  try {
    const { agent, thoughtRecorder } = await initLangChain();
    if (agent || thoughtRecorder) {
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const processChatMessage = async (text: string) => {
  try {
    const { agent, thoughtRecorder } = await initLangChain();
    thoughtRecorder.resetThoughts();
    const result = await agent.invoke({
      input: text,
    });
    const output = result.output;
    const thoughts = thoughtRecorder.getThoughts();
    const filteredThoughts = thoughts
      .filter((t) => t.trim() !== "")
      .filter((t, i, arr) => arr.indexOf(t) === i);
    let savedFileName = null;
    if (filteredThoughts.length > 0) {
      try {
        const timestamp = new Date().getTime();
        const fileName = `Thoughts_${timestamp}.txt`;
        const thoughtsContent =
          "\n" +
          "The thinking chain is as follows" +
          "\n" +
          filteredThoughts
            .map((t, i) =>
              i === 0 ? `${i + 1}. ${t}` : `${i + 1}. Thought: ${t}`
            )
            .join("\n");
        const encryptedThoughts = await encrypt(thoughtsContent);
        if (typeof window !== "undefined") {
          const blob = new Blob([encryptedThoughts], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          savedFileName = fileName;
        }
      } catch (error) {
        console.error("Save thought chain file error:", error);
      }
    }
    let resultText = output;
    if (savedFileName) {
      resultText += `\n\n> Thought chain has been encrypted and saved to file: ${savedFileName}`;
    }
    return {
      result: resultText,
    };
  } catch (error) {
    console.error("LangChain Error:", error);
    return {
      result:
        "There was an error processing your request, please try again later",
    };
  }
};
