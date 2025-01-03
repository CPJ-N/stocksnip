"use client";

import React, { useState } from 'react';
import { Search, RefreshCw, AlertCircle, PieChart, DollarSign, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
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
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import LoadingSpinner from '@/components/LoadingSpinner';
import Footer from '@/components/Footer';

const chartConfig = {
  open: {
    label: "Open Price",
    color: "hsl(var(--chart-1))",
  },
  high: {
    label: "High Price",
    color: "hsl(var(--chart-2))",
  },
  low: {
    label: "Low Price",
    color: "hsl(var(--chart-3))",
  },
  close: {
    label: "Close Price",
    color: "hsl(var(--chart-4))",
  },
  volume: {
    label: "Volume",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

// Add these interfaces at the top of the file
interface TimeSeriesData {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
  "5. volume": string;
}

interface StockData {
  "Time Series (60min)": {
    [timestamp: string]: TimeSeriesData;
  };
  "Meta Data"?: {
    "1. Information": string;
    "2. Symbol": string;
    "3. Last Refreshed": string;
  };
}

interface Article {
  datetime: number;
  headline: string;
  url: string;
  summary?: string;
  publishedAt: string;
}

interface StockOverview {
  Description: string;
  MarketCapitalization: string;
  EPS: string;
  "52WeekHigh": string;
  "52WeekLow": string;
}


const StockSnip = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState(null);
  const [news, setNews] = useState<Article[]>([]);  
  const [stockOverview, setStockOverview] = useState<StockOverview | null>(null);
  const [combinedSummary, setCombinedSummary] = useState<string>("");
  const [pertChange, setPertChange] = useState('');
  const [lastPrice, setLastPrice] = useState('');
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("close");
  const [stockDataReform, setStockDataReform] = useState<{ date: string; open: number; high: number; low: number; close: number; volume: number; }[]>([]);

  const resetState = () => {
    setTicker('');
    setStockData(null);
    setNews([]);
    setCombinedSummary('');
    setPertChange('');
    setLastPrice('');
    setActiveChart('close');
    setStockDataReform([]);
  };

  const fetchStockData = async (symbol: string) => {
    try {
      const response = await fetch("/api/getStockData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });
      const data = await response.json();
      console.log('Stock data:', data);
      return data;
    } catch (err) {
      console.error('[fetchStockData] Error details:', err);
      throw new Error('Failed to fetch stock data');
    }
  };

  const fetchNews = async (symbol: string) => {
    try {
      const response = await fetch("/api/getStockNews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });
      const data = await response.json();
      console.log('Stock news:', data);
      return data.slice(0, 10);
    } catch (err) {
      console.error('[fetchNews] Error details:', err);
      throw new Error('Failed to fetch news');
    }
  };

  const fetchOverview = async (symbol: string) => {
    try {
      const response = await fetch(`/api/getStockData?symbol=${symbol}`); // GET request
      const data = await response.json();
      console.log('Overview data:', data);
      return data;
    } catch (err) {
      console.error('Failed to fetch overview:', err);
      throw err;
    }
  };

  const summarizeArticles = async (article: Article) => {
    try {
      const response = await fetch("/api/getSummary", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({article}),
      });
      
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      
      if (response.status === 202) {
        const fullAnswer = await response.text();
        return fullAnswer;
      }
      
      // This data is a ReadableStream
      const data = response.body;
      if (!data) {
        return;
      }

    } catch (err) {
      console.error('[summarizeArticles] Error details:', err);
      throw new Error('Failed to generate summary');
    }
  };

  const calculatePercentageChange = (stockData: StockData) => {
    if (!stockData["Time Series (60min)"]) {
      return 0;
    }
  
    const timeSeriesData = stockData["Time Series (60min)"];
    const timestamps = Object.keys(timeSeriesData).sort(); // Sort timestamps chronologically
    
    // Get first (oldest) and last (newest) entries
    const oldestEntry = timeSeriesData[timestamps[0]]; // First index = oldest
    const newestEntry = timeSeriesData[timestamps[timestamps.length - 1]]; // Last index = newest
  
    const openPrice = parseFloat(oldestEntry["1. open"]);
    const closePrice = parseFloat(newestEntry["4. close"]);
    setLastPrice(closePrice.toString());
  
    const percentageChange = ((closePrice - openPrice) / openPrice) * 100;
    
    setPertChange(percentageChange.toFixed(2).toString());
  };

  const handleSearch = async () => {
    if (!ticker) return;
    
    resetState();
    setLoading(true);
    setError('');
    
    try {
      const [stockInfo, stockInfoOverview, newsArticles] = await Promise.all([
        fetchStockData(ticker),
        fetchOverview(ticker),
        fetchNews(ticker),
      ]);
      
      setStockOverview(stockInfoOverview);
      setStockData(stockInfo);
      const reformedStockData = Object.entries(stockInfo["Time Series (60min)"]).map(([date, values]) => ({
        date,
        open: parseFloat((values as { [key: string]: string })["1. open"]),
        high: parseFloat((values as { [key: string]: string })["2. high"]),
        low: parseFloat((values as { [key: string]: string })["3. low"]),
        close: parseFloat((values as { [key: string]: string })["4. close"]),
        volume: parseInt((values as { [key: string]: string })["5. volume"], 10),
      }));
      setStockDataReform(reformedStockData);

      const articlesWithSummaries = await Promise.all(
        newsArticles.map(async (article :Article) => ({
          datetime: article.datetime,
          headline: article.headline,
          summary: article.summary,
          url: article.url,
        }))
      );
      setNews(articlesWithSummaries);

      calculatePercentageChange(stockInfo);  

      const [aiSummary] = await Promise.all([
        summarizeArticles(newsArticles),
      ]);
      setCombinedSummary(aiSummary || "");
      
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
            <h1 className="text-4xl font-bold mb-2">
            <span style={{ color: '#1f502c' }}>Stock</span>
            <span style={{ color: '#47a646' }}>Snip</span>
            </h1>
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

        {loading && (
            <div className="flex justify-center items-center mb-8">
              <LoadingSpinner className="w-16 h-16 text-[#39893d]" />
            </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center mb-8">
            <h2 className="text-l font-bold mr-4" style={{ color: '#1f502c' }}>Popular Stock Picks</h2>
            <div className="flex gap-2 flex-wrap">
          {['AAPL', 'MSFT', 'META', 'TSLA'].map((symbol) => (
            <Button
              key={symbol}
              onClick={() => setTicker(symbol)}
              className="bg-white text-[#39893d] hover:bg-[#f0f0f0] px-2 py-1 text-xs"
            >
              {symbol}
            </Button>
          ))}
          </div>
        </div>

        {stockOverview && !loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#1f502c' }}>Market Cap</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(Number(stockOverview.MarketCapitalization) / 1e12).toFixed(1)}T
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#1f502c' }}>52W High</CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stockOverview["52WeekHigh"]}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#1f502c' }}>52W Low</CardTitle>
                <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stockOverview["52WeekLow"]}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#1f502c' }}>EPS</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stockOverview.EPS}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {stockData && !loading && (
          <Card className="mb-8 border-t-4" style={{ borderTopColor: '#47a646' }}>
            <CardHeader>
              <CardTitle style={{ color: '#1f502c' }}>{stockData["Meta Data"]["2. Symbol"]} Stock Information</CardTitle>
              <CardDescription style={{ color: '#2c6c34' }}>Latest trading data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: '#2c6c34' }} className="text-sm">Price</p>
                  <p className="text-xl font-semibold" style={{ color: '#1f502c' }}>
                    ${lastPrice ? lastPrice : 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#2c6c34' }} className="text-sm">Change</p>
                  <p className={`text-xl font-semibold ${
                    parseFloat(stockData['09. change']) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {pertChange ? pertChange : 0}%
                  </p>
                </div>
              </div>
              {stockOverview && stockOverview.Description && (
          <div className="mt-4">
            <p style={{ color: '#2c6c34' }} className="text-sm mt-8 pb-2">Company Description</p>
            <p className="text-base" style={{ color: '#1f502c' }}>
              {stockOverview.Description}
            </p>
          </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {combinedSummary && !loading && (
          <Card className="mb-8 border-t-4" style={{ borderTopColor: '#47a646' }}>
            <CardHeader>
              <CardTitle style={{ color: '#1f502c' }}>AI News Summary</CardTitle>
              <CardDescription style={{ color: '#2c6c34' }}>Summary of the latest news articles</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ color: '#1f502c' }}>{combinedSummary}</p>
            </CardContent>
          </Card>
        )}


        {stockData && !loading && (
          <Card className="mb-8 border-t-4" style={{ borderTopColor: '#47a646' }}>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle>Stock Data Chart</CardTitle>
                <CardDescription>Displaying stock data trends.</CardDescription>
              </div>
              <div className="flex">
                {Object.keys(chartConfig).map((key) => {
                  const chart = key as keyof typeof chartConfig;
                  return (
                    <button
                      key={chart}
                      data-active={activeChart === chart}
                      className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                      onClick={() => setActiveChart(chart)}
                    >
                      <span className="text-xs text-muted-foreground">
                        {chartConfig[chart].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={stockDataReform}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="date"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          });
                        }}
                      />
                    }
                  />
                  <Line
                    dataKey={activeChart}
                    type="monotone"
                    stroke={chartConfig[activeChart].color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {news.length > 0 && !loading && (
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
        <Footer />
      </div>
    </div>
  );
};

export default StockSnip;