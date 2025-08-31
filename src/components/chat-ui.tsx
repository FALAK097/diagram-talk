"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Mic, Paperclip, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

async function convertFilesToDataURLs(files: FileList) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<{
          type: "file";
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: "file",
              mediaType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export const ChatUI = () => {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ url: string; type: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const PLACEHOLDERS = [
    "Ask me about your documents...",
    "Summarize the file I've uploaded",
    "What are the key points in this image?",
    "Compare these two diagrams",
    "Explain this flowchart",
  ];

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  useEffect(() => {
    if (isActive || input) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!input) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [input]);

  const handleActivate = () => setIsActive(true);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const form = e.currentTarget.closest("form");
        if (form) {
          form.requestSubmit();
        }
      } else {
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (!files || files.length === 0) {
      setFilePreviews([]);
      return;
    }

    const newPreviews = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      return {
        url,
        type: file.type,
      };
    });

    setFilePreviews(newPreviews);

    return () => {
      newPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [files]);

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: "var(--shadow-sm)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: filePreviews.length > 0 ? 160 : 68,
      boxShadow: "var(--shadow-md)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { stiffness: 80, damping: 20 },
      },
    },
  };

  const removeFile = (index: number) => {
    if (!files) return;

    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file, i) => {
      if (i !== index) {
        dataTransfer.items.add(file);
      }
    });

    setFiles(dataTransfer.files);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto stretch relative min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto py-4 px-4 pb-36">
        {messages.map((m) => (
          <div
            key={m.id}
            className="whitespace-pre-wrap mb-4 p-3 rounded-lg bg-card text-card-foreground"
          >
            <div className="font-medium mb-1">
              {m.role === "user" ? "You" : "AI"}
            </div>
            <div>
              {m.parts.map((part, index) => {
                if (part.type === "text") {
                  return <span key={`${m.id}-text-${index}`}>{part.text}</span>;
                }
                if (
                  part.type === "file" &&
                  part.mediaType?.startsWith("image/")
                ) {
                  return (
                    <Image
                      key={`${m.id}-image-${index}`}
                      src={part.url}
                      width={500}
                      height={500}
                      alt={`attachment-${index}`}
                      className="my-2 rounded-lg"
                    />
                  );
                }
                if (
                  part.type === "file" &&
                  part.mediaType === "application/pdf"
                ) {
                  return (
                    <iframe
                      key={`${m.id}-pdf-${index}`}
                      src={part.url}
                      width={500}
                      height={600}
                      title={`pdf-${index}`}
                      className="my-2 rounded border border-border"
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>

      <form
        className="fixed bottom-0 w-full max-w-3xl p-4 mb-4"
        onSubmit={async (event) => {
          event.preventDefault();

          if (!input.trim() && (!files || files.length === 0)) return;

          const fileParts =
            files && files.length > 0
              ? await convertFilesToDataURLs(files)
              : [];

          sendMessage({
            role: "user",
            parts: [{ type: "text", text: input }, ...fileParts],
          });

          setInput("");
          setFiles(undefined);
          setFilePreviews([]);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      >
        <motion.div
          ref={wrapperRef}
          className="w-full bg-card"
          variants={containerVariants}
          animate={
            isActive || input || filePreviews.length > 0
              ? "expanded"
              : "collapsed"
          }
          initial="collapsed"
          style={{ overflow: "hidden", borderRadius: 32 }}
          onClick={handleActivate}
        >
          <div className="flex flex-col items-stretch w-full h-full">
            {filePreviews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-4 py-2">
                {filePreviews.map((preview, index) => (
                  <div key={preview.url} className="relative">
                    {preview.type.startsWith("image/") ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden">
                        <Image
                          src={preview.url}
                          alt={`Preview ${index}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-muted text-muted-foreground bg-opacity-70 rounded-full p-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 bg-muted rounded relative">
                        <span className="text-xs text-center overflow-hidden text-ellipsis px-1 text-muted-foreground">
                          PDF
                        </span>
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-muted-foreground text-muted bg-opacity-70 rounded-full p-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-full w-full">
              <button
                className="p-3 rounded-full hover:bg-muted transition"
                title="Attach file"
                type="button"
                tabIndex={-1}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={20} />
              </button>

              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    setFiles(event.target.files);
                  }
                }}
                multiple
                ref={fileInputRef}
              />

              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal text-card-foreground"
                  style={{ position: "relative", zIndex: 1 }}
                  onFocus={handleActivate}
                  placeholder={isActive ? "Type a message..." : ""}
                />
                <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                  <AnimatePresence mode="wait">
                    {showPlaceholder && !isActive && !input && (
                      <motion.span
                        key={placeholderIndex}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground select-none pointer-events-none"
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          zIndex: 0,
                        }}
                        variants={placeholderContainerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        {PLACEHOLDERS[placeholderIndex]
                          .split("")
                          .map((char, i) => (
                            <motion.span
                              key={`${PLACEHOLDERS[placeholderIndex]}-${i}`}
                              variants={letterVariants}
                              style={{ display: "inline-block" }}
                            >
                              {char === " " ? "\u00A0" : char}
                            </motion.span>
                          ))}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                className="p-3 rounded-full hover:bg-muted transition"
                title="Voice input"
                type="button"
                tabIndex={-1}
              >
                <Mic size={20} />
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full font-medium justify-center transition-colors"
                    title="Send"
                    type="submit"
                    tabIndex={-1}
                  >
                    <Send size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Press Ctrl+Enter to send</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {files && files.length > 0 && !filePreviews.length && (
              <div className="ml-2 text-sm text-primary font-medium">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </div>
            )}
          </div>
        </motion.div>
      </form>
    </div>
  );
};
