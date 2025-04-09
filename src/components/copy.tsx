import message from "antd/es/message";


export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success({ content: 'Copied successfully' });
  } catch (error) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      message.success({ content: 'Copied successfully' });
    } catch (error) {
      message.success({ content: 'Copied failed' });
      throw error;
    }
    document.body.removeChild(textArea);
    console.log(error)
  }
}