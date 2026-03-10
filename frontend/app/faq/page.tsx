'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

const faqs = [
  {
    section: 'General',
    items: [
      { q: 'What is AI Finance?', a: 'AI Finance is a personal finance management platform that helps you track your spending, detect unusual transactions using machine learning, and predict your future expenses based on your spending history.' },
      { q: 'Is my financial data safe?', a: 'Yes. Your data is stored in a private database and is only accessible to your account. We use JWT authentication so only you can access your transactions.' },
      { q: 'Is this app free to use?', a: 'Yes, completely free.' },
    ],
  },
  {
    section: 'Transactions',
    items: [
      { q: 'How do I add a transaction?', a: 'Go to the Transactions page, fill in the amount, description, category, and date, then click Add Transaction. The category will be auto-detected from your description if you leave it as "Other".' },
      { q: 'Can I add future-dated transactions?', a: "No. The app only accepts transactions with today's date or past dates. Future dates are rejected to keep your data accurate." },
      { q: 'How do I delete a transaction?', a: 'On the Transactions page, find the transaction in the table and click the Delete button on the right side of the row.' },
      { q: 'What categories are supported?', a: 'Food, Transport, Shopping, Entertainment, Health, Utilities, and Other.' },
    ],
  },
  {
    section: 'CSV Upload',
    items: [
      { q: 'How do I upload transactions via CSV?', a: 'Go to the Transactions page, click Browse File, select your CSV file, then click Upload CSV.' },
      { q: 'What format should my CSV be in?', a: 'Your CSV should have: amount, description, category, date. Example: 500, Grocery shopping, food, 2026-03-01.' },
      { q: 'Can I upload my bank statement directly?', a: 'Yes, if it is a CSV with columns like date, details, debit, credit, balance — the app auto-detects it and imports only debit transactions.' },
      { q: 'What if my bank statement is password protected?', a: 'Open the file with the password first, re-save it without a password, then upload.' },
    ],
  },
  {
    section: 'AI Features',
    items: [
      { q: 'How does anomaly detection work?', a: 'We use Isolation Forest. It flags transactions that are statistically unusual compared to your normal spending pattern. A ₹9000 transaction when everything else is ₹300-800 will get flagged.' },
      { q: 'How does expense prediction work?', a: "We group your transactions by month, then use Linear Regression to find the trend. The model extends that trend to predict next month's total." },
      { q: 'How does automatic category detection work?', a: 'A TF-IDF + Logistic Regression model reads your description and predicts the category. "Swiggy order" → Food, "Uber ride" → Transport, "Amazon purchase" → Shopping.' },
      { q: 'How many transactions do I need?', a: 'Anomaly detection needs at least 5 transactions. Expense prediction needs data across at least 2 different months.' },
    ],
  },
  {
    section: 'Budget',
    items: [
      { q: 'How do I set a monthly budget?', a: 'On the Dashboard page, enter your monthly budget amount in the input field at the top and click Set Budget.' },
      { q: 'When do I get a budget warning?', a: 'Yellow warning at 80% usage, red warning when you exceed 100%.' },
      { q: 'Can I change my budget?', a: 'Yes. Enter a new amount and click Update Budget.' },
    ],
  },
  {
    section: 'Demo Account',
    items: [
      { q: 'What is the demo account?', a: 'The demo account (username: demo, password: demo123) lets you explore all features without signing up. It comes pre-loaded with 3 months of realistic transactions, a set budget, and an anomalous transaction so you can see anomaly detection in action.' },
      { q: 'Can the demo account add or delete transactions?', a: 'No. The demo account is read-only. If you try to add, delete, or upload CSV transactions, you will see a message: "This is a demo account. Create your own account for real interactions."' },
      { q: 'How do I get my own account?', a: 'On the login page, click Register, choose a username and password (minimum 6 characters), and you are ready. Your data is completely separate from the demo account.' },
    ],
  },
  {
    section: 'Account',
    items: [
      { q: 'How do I create an account?', a: 'Go to the Login page, click Register, enter a username and password (minimum 6 characters).' },
      { q: 'How do I log out?', a: 'Click the Logout button at the bottom of the left sidebar.' },
      { q: 'What happens if my session expires?', a: 'You will be automatically redirected to the login page.' },
    ],
  },
]

export default function FaqPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (key: string) => setOpen(open === key ? null : key)

  return (
    <div className="flex min-h-screen bg-[#f5f4f0] dark:bg-[#0f1117]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 bg-white dark:bg-[#13151f] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Finance</span>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">FAQ</h1>
            <p className="text-gray-400 text-sm mt-0.5">Everything you need to know about AI Finance</p>
          </div>

          <div className="max-w-2xl">
            {faqs.map(section => (
              <div key={section.section} className="mb-7">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">{section.section}</p>
                <div className="flex flex-col gap-2">
                  {section.items.map((item, i) => {
                    const key = `${section.section}-${i}`
                    const isOpen = open === key
                    return (
                      <div key={key} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <button onClick={() => toggle(key)} className="w-full flex justify-between items-center px-4 lg:px-5 py-4 text-left gap-3">
                          <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{item.q}</span>
                          <span className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 lg:px-5 pb-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-50 dark:border-gray-800 pt-3">
                            {item.a}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
