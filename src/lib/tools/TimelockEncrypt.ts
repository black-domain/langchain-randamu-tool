import { Tool } from "langchain/tools";
import { Buffer, mainnetClient, roundAt, timelockEncrypt } from "tlock-js";


export const encrypt = async (input: string, minutes: number = 5): Promise<string> => {
  const payload = Buffer.from(input);

  const chainInfo = await mainnetClient().chain().info();

  const time = new Date(Date.now() + Number(minutes) * 60 * 1000).valueOf();

  const roundNumber = roundAt(time, chainInfo);

  const ciphertext = await timelockEncrypt(
    roundNumber,
    payload,
    mainnetClient(),
  );
  return ciphertext
}


export class TimelockEncrypt extends Tool {
  name = "timelock-encrypt";
  description = "Encrypt the specified content through the time lock encryption tool. Input format: 'content|minutes' where 'content' is the text to encrypt and 'minutes' is the optional time in minutes (defaults to 5 if not specified). Example: 'Hello world|10' or just 'Hello world'";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let content = input;
      let minutes = 5;
      
      if (input.includes('|')) {
        const parts = input.split('|');
        content = parts[0];
        const minutesInput = parts[1];
        
        if (minutesInput) {
          const parsedMinutes = Number(minutesInput);
          if (!isNaN(parsedMinutes)) {
            minutes = parsedMinutes;
          }
        }
      }
      
      console.log("Timelock encrypt input:", content, "minutes:", minutes);
      const ciphertext = await encrypt(content, minutes);

      return JSON.stringify({
        success: true,
        ciphertext: ciphertext
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}