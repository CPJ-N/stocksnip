# StockSnip

![StockSnip](public/stocksnip.png)

StockSnip is a Next.js-based application designed to provide concise, AI-generated summaries of recent news articles about specific stock tickers. Stay informed without spending hours sifting through lengthy articles.

## Getting Started

To get started with StockSnip, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can begin development by editing the main entry point in `app/page.tsx`. The page auto-updates as you make changes.

## Features

- **AI-Powered Summarization**: Get concise summaries of stock-related news articles.
- **Ticker-Based Search**: Input a stock ticker and retrieve the latest news summaries.
- **Clean and Responsive UI**: Built with Tailwind CSS and Shadcn components for a modern design.
- **Efficient API Integrations**: Uses Alpha Vantage for news retrieval and Together Compute for summarization.

## Font Optimization

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to optimize and load [Geist](https://vercel.com/font), a modern font family provided by Vercel.

## Learn More

To dive deeper into the technologies used in StockSnip, explore the following resources:

- [Next.js Documentation](https://nextjs.org/docs): Learn about Next.js features and APIs.
- [Learn Next.js](https://nextjs.org/learn): A comprehensive interactive tutorial.
- [Alpha Vantage API](https://www.alphavantage.co/documentation/): Documentation for the stock data and news API.
- [Together Compute](https://together.xyz): Learn about the AI platform powering our summarization.

## Deploy on Vercel

Deploy StockSnip effortlessly using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the creators of Next.js.

For more deployment instructions, check out the [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying).
