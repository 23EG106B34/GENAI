import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#22d3ee',
  '#34d399',
  '#a78bfa',
  '#fb7185',
  '#fbbf24',
  '#60a5fa',
  '#f472b6',
  '#4ade80',
  '#c084fc',
  '#94a3b8',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-white">{label || payload[0].name}</p>
      <p className="text-sm text-cyan-400">${Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

export default function Charts({ transactions }) {
  const monthlyMap = {};
  const categoryMap = {};

  transactions.forEach((tx) => {
    const month = new Date(tx.date).toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
    });

    if (!monthlyMap[month]) {
      monthlyMap[month] = { month, income: 0, expense: 0 };
    }

    if (tx.type === 'income') {
      monthlyMap[month].income += tx.amount;
    } else {
      monthlyMap[month].expense += tx.amount;
    }

    if (tx.type === 'expense') {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    }
  });

  const monthlyData = Object.values(monthlyMap).slice(-6);
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Income vs Expenses</h2>
        {monthlyData.length === 0 ? (
          <p className="text-slate-400 text-center py-16">Add transactions to see trends</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Expenses by Category</h2>
        {categoryData.length === 0 ? (
          <p className="text-slate-400 text-center py-16">Add expense transactions to see breakdown</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
