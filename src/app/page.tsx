"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';

// Sigma imports
import Graph from "graphology";
import "@react-sigma/core/lib/style.css";

// Types
type SearchResult = {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score: number;
  text?: string;
  image?: string;
  favicon?: string;
};

// Mock API functions (same as before)
const mockSearch = async (searchQuery: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return [
    {
      id: "https://example.com/article1",
      title: "Understanding Next.js and React",
      url: "https://example.com/article1",
      publishedDate: "2024-04-15T00:00:00.000Z",
      author: "Jane Developer",
      score: 0.95,
      text: "Next.js is a powerful framework for building React applications with server-side rendering capabilities...",
      favicon: "https://example.com/favicon.ico"
    },
    {
      id: "https://example.com/article2",
      title: "Modern Web Development Practices",
      url: "https://example.com/article2",
      publishedDate: "2024-03-10T00:00:00.000Z",
      author: "John Coder",
      score: 0.87,
      text: "Today's web development landscape requires knowledge of various tools and frameworks...",
      favicon: "https://example.com/favicon.ico"
    },
    {
      id: "https://example.com/article3",
      title: "TypeScript Best Practices",
      url: "https://example.com/article3",
      publishedDate: "2024-02-20T00:00:00.000Z",
      author: "Sarah TypeScript",
      score: 0.82,
      text: "TypeScript adds static typing to JavaScript, enabling better tooling and developer experience...",
      favicon: "https://example.com/favicon.ico"
    },
    {
      id: "https://example.com/article4",
      title: "Tailwind CSS for Rapid UI Development",
      url: "https://example.com/article4",
      publishedDate: "2024-01-05T00:00:00.000Z",
      author: "Design Team",
      score: 0.79,
      text: "Tailwind CSS provides utility classes that enable rapid UI development without leaving your HTML...",
      favicon: "https://example.com/favicon.ico"
    },
    {
      id: "https://example.com/article5",
      title: "State Management in React Applications",
      url: "https://example.com/article5",
      publishedDate: "2023-12-12T00:00:00.000Z",
      author: "React Community",
      score: 0.76,
      text: "Managing state effectively is crucial for building complex React applications that scale well...",
      favicon: "https://example.com/favicon.ico"
    }
  ];
};

const mockFindSimilar = async (url: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return [
    {
      id: "https://example.com/related1",
      title: "Advanced React Patterns",
      url: "https://example.com/related1",
      publishedDate: "2024-03-05T00:00:00.000Z",
      author: "React Expert",
      score: 0.88,
      text: "This article explores advanced patterns for React component composition and state management...",
      favicon: "https://example.com/favicon.ico"
    },
    {
      id: "https://example.com/related2",
      title: "Server Components in Next.js",
      url: "https://example.com/related2",
      publishedDate: "2024-02-28T00:00:00.000Z",
      author: "Next.js Team",
      score: 0.85,
      text: "Server Components represent a paradigm shift in how we build React applications with Next.js...",
      favicon: "https://example.com/favicon.ico"
    },
    {
      id: "https://example.com/related3",
      title: "React Performance Optimization",
      url: "https://example.com/related3",
      publishedDate: "2024-01-20T00:00:00.000Z",
      author: "Performance Guru",
      score: 0.81,
      text: "Learn how to identify and fix performance bottlenecks in your React applications...",
      favicon: "https://example.com/favicon.ico"
    }
  ];
};

const GraphLoader = dynamic(
  () => Promise.resolve().then(() => {
    const { useLoadGraph, useSigma } = require("@react-sigma/core");
    const Graph = require("graphology").default;
    const { useEffect } = require("react");

    return function GraphLoaderComponent({ selectedResult, similarResults, onNodeClick }: {
      selectedResult: SearchResult;
      similarResults: SearchResult[];
      onNodeClick: (nodeId: string) => void;
    }) {
      const loadGraph = useLoadGraph();
      const sigma = useSigma();

      useEffect(() => {
        const existingGraph = sigma.getGraph();

        // Clear the entire graph first
        existingGraph.clear();

        // Add the selected result as the center node
        existingGraph.addNode(selectedResult.id, {
          label: selectedResult.title.length > 30 ? selectedResult.title.substring(0, 30) + "..." : selectedResult.title,
          x: 0,
          y: 0,
          size: 20,
          color: "#4361ee",
        });

        // Add similar results as surrounding nodes
        const radius = 2;
        similarResults.forEach((similar, index) => {
          // Check if node already exists before adding (extra safety)
          if (!existingGraph.hasNode(similar.id)) {
            const angle = (index * 2 * Math.PI) / similarResults.length;
            existingGraph.addNode(similar.id, {
              label: similar.title.length > 25 ? similar.title.substring(0, 25) + "..." : similar.title,
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              size: 15,
              color: "#4cc9f0",
            });
          }

          // Check if edge already exists before adding
          if (!existingGraph.hasEdge(selectedResult.id, similar.id)) {
            existingGraph.addEdge(selectedResult.id, similar.id, {
              color: "#E5E5E5",
              size: Math.max(1, similar.score * 2),
            });
          }
        });

        const handleClick = (e: any) => {
          if (e.node) {
            onNodeClick(e.node);
          }
        };

        // Remove existing listeners before adding new ones
        sigma.off("clickNode", handleClick);
        sigma.on("clickNode", handleClick);

        return () => {
          sigma.off("clickNode", handleClick);
        };
      }, [selectedResult, similarResults, sigma, onNodeClick]);

      return null;
    };
  }),
  { ssr: false }
);

const SigmaContainer = dynamic(
  () => import('@react-sigma/core').then(mod => mod.SigmaContainer),
  { ssr: false }
);

const ControlsContainer = dynamic(
  () => import('@react-sigma/core').then(mod => mod.ControlsContainer),
  { ssr: false }
);

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [similarResults, setSimilarResults] = useState<SearchResult[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      const results = await mockSearch(query);
      setSearchResults(results);

      setSelectedResult(null);
      setSimilarResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    if (isLoadingSimilar) return;
    if (selectedResult && selectedResult.id === result.id) return;

    setSelectedResult(result);
    setIsLoadingSimilar(true);

    try {
      const similar = await mockFindSimilar(result.url);
      setSimilarResults(similar);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    let result = searchResults.find(r => r.id === nodeId) ||
      similarResults.find(r => r.id === nodeId);

    if (!result) {
      result = {
        id: nodeId,
        title: "Loading content...",
        url: nodeId,
        score: 0.8,
        text: "Loading content..."
      };
    }

    handleResultClick(result);
  }, [searchResults, similarResults, isLoadingSimilar, selectedResult]);

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-10">
        <h1 className="font-[family-name:var(--font-newsreader)] text-4xl md:text-5xl font-bold mb-4 pt-4">
          <span className="text-blue-600 mt-4">Rabbithole</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover unexpected connections between topics using Exa&apos;s powerful semantic search
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              className="pl-10 pr-4 py-6 text-lg"
              placeholder="Search any topic to start your exploration..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="text-md hover:cursor-pointer py-6 px-8" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-semibold mb-4">Search Results</h2>

          {isSearching ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <Card
                key={result.id}
                className={`mb-4 cursor-pointer hover:border-blue-500 transition-colors ${selectedResult?.id === result.id ? 'border-blue-500 border-2' : ''
                  }`}
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {result.favicon && (
                      <img src={result.favicon} alt="" className="w-5 h-5 mt-1" />
                    )}
                    <div>
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{result.url}</p>
                      {result.publishedDate && (
                        <Badge variant="outline" className="mt-2">
                          {new Date(result.publishedDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : query ? (
            <p className="text-center py-8 text-muted-foreground">No results found</p>
          ) : null}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedResult ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-semibold">
                    {selectedResult.title}
                  </h2>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedResult.url} target="_blank" rel="noopener noreferrer">
                      Visit Source
                    </a>
                  </Button>
                </div>

                {selectedResult.author && (
                  <p className="text-sm text-muted-foreground mb-4">
                    By {selectedResult.author}
                    {selectedResult.publishedDate && (
                      <> • {new Date(selectedResult.publishedDate).toLocaleDateString()}</>
                    )}
                  </p>
                )}

                <div className="prose dark:prose-invert max-w-none">
                  {selectedResult.text ? (
                    <p>{selectedResult.text}</p>
                  ) : (
                    <Skeleton className="h-24 w-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : searchResults.length > 0 ? (
            <div className="flex items-center justify-center h-40 border rounded-lg">
              <p className="text-muted-foreground">Select a result to view content</p>
            </div>
          ) : null}

          {selectedResult && similarResults.length > 0 && (
            <Card className="overflow-hidden">
              <CardContent className="p-0" style={{ height: "400px" }}>
                {isLoadingSimilar ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Finding related content...</p>
                  </div>
                ) : (
                  <SigmaContainer
                    style={{ height: "100%", width: "100%" }}
                    settings={{
                      defaultNodeColor: "#4361ee",
                      defaultEdgeColor: "#E5E5E5",
                      renderLabels: true,
                      renderEdgeLabels: false,
                      enableEdgeEvents: false,
                      allowInvalidContainer: true,
                    }}
                  >
                    <GraphLoader
                      selectedResult={selectedResult}
                      similarResults={similarResults}
                      onNodeClick={handleNodeClick}
                    />
                    <ControlsContainer position="bottom-right">
                    </ControlsContainer>
                  </SigmaContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {!searchResults.length && (
        <div className="mt-16 text-center">
          <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="font-medium mb-2">1. Search a topic</h3>
              <p className="text-sm text-muted-foreground">
                Start by searching any topic you're curious about.
              </p>
            </div>
            <div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-6 w-6 text-blue-600 dark:text-blue-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2">2. Explore content</h3>
              <p className="text-sm text-muted-foreground">
                Read through the search results and select any that interest you.
              </p>
            </div>
            <div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-6 w-6 text-blue-600 dark:text-blue-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2">3. Discover connections</h3>
              <p className="text-sm text-muted-foreground">
                See related content in the interactive graph and click nodes to go deeper down the rabbithole.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}