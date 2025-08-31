import { ChatUI } from "@/components/chat-ui";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <ChatUI />
    </main>
  );
}
