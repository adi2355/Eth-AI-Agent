"use client";

import { useState } from "react";
import { Bot, LineChart, FileCode2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletConnect } from "@/components/WalletConnect";
import { Analytics } from "@/components/Analytics";
import { ContractInteraction } from "@/components/ContractInteraction";
import { Learn } from "@/components/Learn";
import { ChatInterface } from "@/components/ChatInterface";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "analytics" | "contracts" | "learn">("chat");

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return (
          <ErrorBoundary>
            <Analytics />
          </ErrorBoundary>
        );
      case "contracts":
        return (
          <ErrorBoundary>
            <ContractInteraction />
          </ErrorBoundary>
        );
      case "learn":
        return (
          <ErrorBoundary>
            <Learn />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <ChatInterface />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Bot className="h-8 w-8" />
                <span className="ml-2 text-xl font-bold">BlockchainGPT</span>
              </div>
            </div>
            <div className="flex items-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-card rounded-lg shadow-sm p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={cn(
                    "w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                    activeTab === "chat"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Bot className="h-5 w-5" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={cn(
                    "w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                    activeTab === "analytics"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <LineChart className="h-5 w-5" />
                  <span>Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab("contracts")}
                  className={cn(
                    "w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                    activeTab === "contracts"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <FileCode2 className="h-5 w-5" />
                  <span>Contracts</span>
                </button>
                <button
                  onClick={() => setActiveTab("learn")}
                  className={cn(
                    "w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                    activeTab === "learn"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Learn</span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-9">
            <div className="bg-card rounded-lg shadow-sm">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}