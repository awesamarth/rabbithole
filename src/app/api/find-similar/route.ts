import { NextRequest, NextResponse } from 'next/server';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

// Define our own SearchResult type to avoid conflicts
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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const results = await exa.findSimilarAndContents(url, {
      numResults: 3,
      text: { maxCharacters: 1500 },
      highlights: true,
      excludeSourceDomain: true
    });

    // Transform Exa results to match our SearchResult type
    const similarResults: SearchResult[] = results.results.map((result: any) => ({
      id: result.id,
      title: result.title,
      url: result.url,
      publishedDate: result.publishedDate,
      author: result.author,
      score: result.score,
      text: result.text,
      image: result.image,
      favicon: result.favicon
    }));

    return NextResponse.json({ results: similarResults });
  } catch (error) {
    console.error('Find similar error:', error);
    return NextResponse.json(
      { error: 'Failed to find similar content' }, 
      { status: 500 }
    );
  }
}