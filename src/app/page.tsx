"use client";

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const StockSnip = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState(null);
  interface Article {
    headline: string;
    datetime: number;
    summary: string;
    aiSummary?: string;
    url: string;
  }
  
  const [news, setNews] = useState<Article[]>([]);

  const ALPHA_VANTAGE_API_KEY = 'your_api_key';
  const FINNHUB_API_KEY = 'your_api_key';
  const TOGETHER_API_KEY = 'your_api_key';

  const fetchStockData = async (symbol: any) => {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      const data = await response.json();
      return data['Global Quote'];
    } catch (err) {
      throw new Error('Failed to fetch stock data');
    }
  };

  const fetchNews = async (symbol: any) => {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2024-01-01&to=2024-12-31&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      return data.slice(0, 5);
    } catch (err) {
      throw new Error('Failed to fetch news');
    }
  };

  const summarizeArticle = async (article: any) => {
    try {
      const response = await fetch('https://api.together.xyz/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'togethercomputer/llama-2-7b-chat',
          prompt: `Please provide a concise summary of this news article: ${article.headline}\n\n${article.summary}`,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      return data.output.choices[0].text;
    } catch (err) {
      throw new Error('Failed to generate summary');
    }
  };

  const handleSearch = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [stockInfo, newsArticles] = await Promise.all([
        fetchStockData(ticker),
        fetchNews(ticker),
      ]);

      setStockData(stockInfo);

      const articlesWithSummaries = await Promise.all(
        newsArticles.map(async (article :any) => ({
          ...article,
          aiSummary: await summarizeArticle(article),
        }))
      );

      setNews(articlesWithSummaries);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fcfcfc' }}>
      <div className="max-w-4xl mx-auto p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1f502c' }}>StockSnip</h1>
          <p style={{ color: '#2c6c34' }}>Get AI-powered summaries of the latest stock news</p>
        </header>

        <div className="flex gap-4 mb-8">
          <Input
            type="text"
            placeholder="Enter stock ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !ticker}
            className="min-w-24 bg-[#39893d] text-[#fcfcfc] hover:bg-[#2c6c34]"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stockData && (
          <Card className="mb-8 border-t-4" style={{ borderTopColor: '#47a646' }}>
            <CardHeader>
              <CardTitle style={{ color: '#1f502c' }}>{ticker} Stock Information</CardTitle>
              <CardDescription style={{ color: '#2c6c34' }}>Latest trading data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: '#2c6c34' }} className="text-sm">Price</p>
                  <p className="text-xl font-semibold" style={{ color: '#1f502c' }}>
                    ${stockData['05. price']}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#2c6c34' }} className="text-sm">Change</p>
                  <p className={`text-xl font-semibold ${
                    parseFloat(stockData['09. change']) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {stockData['09. change']}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {news.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1f502c' }}>Latest News</h2>
            {news.map((article, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: '#39893d' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#1f502c' }}>{article.headline}</CardTitle>
                  <CardDescription style={{ color: '#2c6c34' }}>
                    {new Date(article.datetime * 1000).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-2" style={{ color: '#39893d' }}>
                        Original Article
                      </h3>
                      <p style={{ color: '#1f502c' }}>{article.summary}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-2" style={{ color: '#39893d' }}>
                        AI Summary
                      </h3>
                      <p style={{ color: '#1f502c' }}>{article.aiSummary}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: '#47a646' }}
                  >
                    Read full article →
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSnip;