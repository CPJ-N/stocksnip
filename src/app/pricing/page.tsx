import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'StockSnip - Pricing',
  description: 'Simple and transparent pricing plans for StockSnip',
}

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    interval: '/forever',
    description: 'For individual investors getting started',
    features: [
      'Basic stock data and charts',
      'Limited news summaries',
      'Standard refresh rate',
      'Basic market analysis',
      'Community access',
    ],
    buttonText: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$10',
    interval: '/month',
    description: 'For serious traders and investors',
    features: [
      'Real-time stock data',
      'Unlimited AI news summaries',
      'Priority API access',
      'Advanced technical analysis',
      'Custom alerts and notifications',
      'Priority support',
    ],
    buttonText: 'Upgrade to Pro',
    highlighted: true,
  },
]

export default function PricingPage() {
  return (
    <div className="bg-brand-light py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-brand-medium">
            Choose the plan that best fits your investment needs
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:mt-20 lg:grid-cols-2">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 ring-2 ${
                plan.highlighted
                  ? 'bg-white text-brand-dark ring-brand-green'
                  : 'bg-white text-brand-dark ring-brand-medium/30'
              }`}
            >
              <h3 className="text-lg font-semibold leading-8">{plan.name}</h3>
              <p className="mt-4 text-sm leading-6 text-brand-medium">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-sm font-semibold leading-6">{plan.interval}</span>
              </div>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg
                      className={`h-6 w-5 flex-none ${
                        plan.highlighted ? 'text-brand-green' : 'text-brand-medium'
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.highlighted
                    ? 'bg-brand-green text-white hover:bg-brand-darker focus-visible:outline-brand-green'
                    : 'bg-brand-medium text-white hover:bg-brand-dark focus-visible:outline-brand-darker'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
