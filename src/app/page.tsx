"use client";
import { Button, Layout, Upload, message } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import Image from "next/image";
import { processChatMessage, initializeLangChainOnLoad } from "@/lib/langchain";
import { UploadOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";

interface ChatItem {
  role: string;
  message: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedContent, setUploadedContent] = useState("");
  const [fileList, setFileList] = useState<any[]>([]);

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#fff",
    height: "auto",
    paddingLeft: "20px",
  };

  const contentStyle: React.CSSProperties = {
    textAlign: "start",
    color: "#000",
  };

  const layoutStyle = {
    overflow: "hidden",
    width: "100%",
    maxWidth: "100%",
  };

  const OnSubmit = async () => {
    if ((input.trim() === "" && uploadedContent.trim() === "") || isLoading) {
      return;
    }

    const userInput = input + (uploadedContent ? " The file content is: " +uploadedContent : "");

    setChatList([...chatList, { role: "User", message: userInput }]);

    setChatList((prev) => [...prev, { role: "Robot", message: "waiting" }]);
    setIsLoading(true);
    setInput("");
    setUploadedContent("");
    setFileList([]);

    try {
      const data = await processChatMessage(userInput);

      const result = data.result || "No result";

      setChatList((prev) => [
        ...prev.slice(0, prev.length - 1),
        { role: "Robot", message: result },
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching the API:", error);

      setChatList((prev) => [
        ...prev.slice(0, prev.length - 1),
        { role: "Robot", message: "Sorry, could not process your reauest" },
      ]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const scrollElement = document.getElementById("scroll-element");
    if (scrollElement) {
      scrollElement.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatList]);

  useEffect(() => {
    initializeLangChainOnLoad().then((success) => {
      if (success) {
        console.log("LangChain initialized successfully");
      } else {
        console.error("LangChain initialization failed");
      }
    });
  }, []);

  return (
    <Layout style={layoutStyle} className="flex h-full w-full flex-col">
      <Header
        style={headerStyle}
        className="h-24 flex items-center justify-start "
      >
        <Image
          src="/timelock-logo.png"
          alt="logo"
          width={40}
          height={40}
          className="rounded-full"
          style={{ objectFit: "cover" }}
        />
        <div className="text-2xl font-bold py-4 ml-2">
          {"Timelock Showcase"}
        </div>
      </Header>
      <Content
        style={contentStyle}
        className=" flex flex-1 flex-col items-center justify-start bg-white"
      >
        <div className="flex flex-1 max-w-[750px] w-full flex-col items-center justify-start my-4 overflow-y-scroll ">
          {chatList?.length === 0 ? (
            <div className="h-full  flex items-center justify-center ">
              <div className="text-center color-black text-3xl font-bold">
                {"What can I help with?"}
              </div>
            </div>
          ) : (
            chatList.map((item, index) => (
              <div
                key={index}
                className={`w-full h-auto flex items-start justify-start p-2 rounded-lg ${
                  item?.role === "User" ? "flex-row-reverse" : ""
                }`}
              >
                {item?.role === "User" ? null : (
                  <div className="min-w-8">
                    <Image
                      src="/timelock-logo.png"
                      alt="logo"
                      width={28}
                      height={28}
                    />
                  </div>
                )}
                <div
                  className={` mx-2 min-w-1 break-words text-wrap ${
                    item?.role === "User" ? "bg-[#f3f3f3] rounded-lg p-2" : ""
                  }`}
                >
                  {item?.message === "waiting" ? (
                    <div className="flex items-end justify-center gap-2 mt-4">
                      <span className="dot bg-gray-500 w-1.5 h-1.5 rounded-full animate-bounce-1"></span>
                      <span className="dot bg-gray-500 w-1.5 h-1.5 rounded-full animate-bounce-2"></span>
                      <span className="dot bg-gray-500 w-1.5 h-1.5 rounded-full animate-bounce-3"></span>
                    </div>
                  ) : (
                    <Markdown content={item?.message} />
                  )}
                </div>
              </div>
            ))
          )}

          <div className="h-0 w-0" id="scroll-element" />
        </div>
        <div className="flex items-center justify-center w-full mb-4">
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            itemRender={() => null}
            beforeUpload={(file) => {
              const isTxt =
                file.type === "text/plain" || file.name.endsWith(".txt");
              if (!isTxt) {
                message.error("Only support TXT!");
                return Upload.LIST_IGNORE;
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                const content = e.target?.result as string;
                setUploadedContent(content);
                message.success(
                  `File ${file.name} will be attached to the message when sent`
                );
              };
              reader.readAsText(file);
              return false;
            }}
            showUploadList={false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />} size="large"></Button>
          </Upload>
          <div className="relative">
            <div className="absolute bottom-full mb-2 w-full">
              {fileList.map((file, index) => (
                <div
                  key={index}
                  className="ml-2 bg-white border min-w-[100px] max-w-[150px] rounded p-1 mb-1 text-sm flex justify-between items-center"
                  title={file.name}
                >
                  <span className="truncate flex-grow">{file.name}</span>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const newFileList = [...fileList];
                      newFileList.splice(index, 1);
                      setFileList(newFileList);
                      setUploadedContent("");
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <TextArea
              size="large"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoSize={{ maxRows: 4 }}
              style={{ width: 600, marginLeft: "10px" }}
              placeholder="Just tell me what you want to talk about..."
              onPressEnter={(e) => {
                if (e.key === "Enter" && e.keyCode === 13 && e.shiftKey) {
                } else if (e.key === "Enter" && e.keyCode === 13) {
                  OnSubmit();
                  e.preventDefault();
                }
              }}
            />
          </div>
          <Button
            type="primary"
            className="ml-4"
            size="large"
            onClick={() => OnSubmit()}
            disabled={isLoading || input.trim() === ""}
          >
            {"Send"}
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
