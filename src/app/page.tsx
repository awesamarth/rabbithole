"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";


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

// Replace the mock functions with these:
const searchWithExa = async (searchQuery: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

const findSimilarWithExa = async (url: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch('/api/find-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Find similar failed');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Find similar error:', error);
    return [];
  }
};

const GraphLoader = dynamic(
  () => Promise.resolve().then(() => {
    const { useLoadGraph, useSigma } = require("@react-sigma/core");
    const Graph = require("graphology").default;
    const { useEffect } = require("react");
    const { useTheme } = require("next-themes");

    return function GraphLoaderComponent({ selectedResult, similarResults, onNodeClick }: {
      selectedResult: SearchResult;
      similarResults: SearchResult[];
      onNodeClick: (nodeId: string) => void;
    }) {
      const loadGraph = useLoadGraph();
      const sigma = useSigma();
      const { theme, resolvedTheme } = useTheme();

      // Check if we're in dark mode
      const isDark = resolvedTheme === 'dark';

      useEffect(() => {
        const existingGraph = sigma.getGraph();
        existingGraph.clear();

        // Theme-aware colors
        const centerNodeColor = isDark ? "#60a5fa" : "#4361ee"; // Brighter blue for dark mode
        const similarNodeColor = isDark ? "#7dd3fc" : "#4cc9f0"; // Light cyan for dark mode
        const edgeColor = isDark ? "#6b7280" : "#E5E5E5"; // Medium gray for dark mode

        // Add the selected result as the center node
        existingGraph.addNode(selectedResult.id, {
          label: selectedResult.title.length > 30 ? selectedResult.title.substring(0, 30) + "..." : selectedResult.title,
          x: 0,
          y: 0,
          size: 20,
          color: centerNodeColor,
        });

        const radius = 2;
        similarResults.forEach((similar, index) => {
          if (!existingGraph.hasNode(similar.id)) {
            const angle = (index * 2 * Math.PI) / similarResults.length;
            existingGraph.addNode(similar.id, {
              label: similar.title.length > 25 ? similar.title.substring(0, 25) + "..." : similar.title,
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              size: 15,
              color: similarNodeColor,
            });
          }

          if (!existingGraph.hasEdge(selectedResult.id, similar.id)) {
            existingGraph.addEdge(selectedResult.id, similar.id, {
              color: edgeColor,
              size: Math.max(1, similar.score * 2),
            });
          }
        });

        const handleClick = (e: any) => {
          if (e.node) {
            onNodeClick(e.node);
          }
        };

        sigma.off("clickNode", handleClick);
        sigma.on("clickNode", handleClick);

        return () => {
          sigma.off("clickNode", handleClick);
        };
      }, [selectedResult, similarResults, sigma, onNodeClick, isDark]);

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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSelectedResult(null);      
    setSimilarResults([]);

    try {
      const results = await searchWithExa(query);
      setSearchResults(results);
    } catch (error) {
      setSearchError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    if (isLoadingSimilar) return;
    if (selectedResult && selectedResult.id === result.id) return;

    setSelectedResult(result);
    setIsLoadingSimilar(true);
    setSimilarError(null);

    try {
      const similar = await findSimilarWithExa(result.url);
      setSimilarResults(similar);
    } catch (error) {
      setSimilarError('Failed to find similar content.');
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
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover unexpected connections between topics using Exa&apos;s powerful search
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
                      <img src={result.favicon} alt="" className="w-5 h-5 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0"> {/* Added flex-1 and min-w-0 */}
                      <h3 className="font-medium break-words">{result.title}</h3> {/* Added break-words */}
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
                    <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/10">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {selectedResult.text}
                      </p>
                    </div>
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
                    style={{
                      height: "100%",
                      width: "100%",
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
                    }}
                    settings={{
                      defaultNodeColor: isDark ? "#60a5fa" : "#4361ee",
                      defaultEdgeColor: isDark ? "#6b7280" : "#E5E5E5",
                      labelColor: {
                        color: isDark ? "#06b6d4" : "#000000"
                      },
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