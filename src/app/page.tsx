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
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Sample response (parsed as JSON)
const stockData2 = {
  "Meta Data": {
      "2. Symbol": "MSFT",
      "3. Last Refreshed": "2024-11-22 19:00:00",
      "4. Interval": "60min",
      "5. Time Zone": "US/Eastern"
  },
  "Time Series (60min)": {
      "2024-11-22 19:00:00": {
          "1. open": "425.8739",
          "2. high": "426.7721",
          "3. low": "416.2732",
          "4. close": "425.6543",
          "5. volume": "15673865"
      },
      "2024-11-22 18:00:00": {
          "1. open": "425.6942",
          "2. high": "426.0335",
          "3. low": "399.4423",
          "4. close": "425.8938",
          "5. volume": "727914"
      }
      // ... more data
  }
};

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


const StockSnip = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState(null);
  const [news, setNews] = useState<any[]>([]);
  const [aiStockSummary, setAiStockSummary] = useState('');
  const [pertChange, setPertChange] = useState('');
  const [lastPrice, setLastPrice] = useState('');
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("close");
  const [stockDataReform, setStockDataReform] = useState<{ date: string; open: number; high: number; low: number; close: number; volume: number; }[]>([]);

  const fetchStockData = async (symbol: any) => {
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
      throw new Error('Failed to fetch stock data');
    }
  };

  const fetchNews = async (symbol: any) => {
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
      throw new Error('Failed to fetch news');
    }
  };

  const summarizeArticle = async (article: any) => {
    try {
      const response = await fetch("/api/getAnswer", {
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
      throw new Error('Failed to generate summary');
    }
  };

  const calculatePercentageChange = (stockData: any) => {
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
    
    setLoading(true);
    setError('');
    
    try {
      const [stockInfo, newsArticles] = await Promise.all([
        fetchStockData(ticker),
        fetchNews(ticker),
      ]);

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
        newsArticles.map(async (article :any) => ({
          datetime: article.datetime,
          headline: article.headline,
          summary: article.summary,
          url: article.url,
        }))
      );

      calculatePercentageChange(stockInfo);  

      // const [aiSummary] = await Promise.all([
      //   // summarizeArticle(newsArticles),
      // ]);
      // setAiStockSummary(aiSummary || '');

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
            </CardContent>
          </Card>
        )}
        {stockData && (
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