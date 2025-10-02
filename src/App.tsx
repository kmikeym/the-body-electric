import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter } from 'recharts';
import { format } from 'date-fns';
import { useWeighIns } from './hooks/useWeighIns';
import { useSettings } from './hooks/useSettings';
import { computeTrend, enrichTrendWithSlope } from './utils/ewma';
import { formatWeight, formatSlope, lbToKg, kgToLb } from './utils/units';
import './App.css';

function App() {
  const { weighIns, addWeighIn } = useWeighIns();
  const { settings, updateSettings } = useSettings();
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Compute trend with EWMA
  const trendData = useMemo(() => {
    if (weighIns.length === 0) return [];
    const trend = computeTrend(weighIns, settings.alpha);
    return enrichTrendWithSlope(trend, settings.caloriePerKg);
  }, [weighIns, settings.alpha, settings.caloriePerKg]);

  // Get latest trend point (most recent date with data)
  const latestPoint = trendData[trendData.length - 1];
  const slope = latestPoint?.slopeKgPerDay || 0;
  const kcal = latestPoint?.kcalPerDay || 0;

  // Trend weight = EWMA value at latest point
  const trendWeight = latestPoint?.trendKg;

  // Actual weight = raw weight value at latest point
  const actualWeight = latestPoint?.weightKg;
  const actualDate = latestPoint?.date;

  // Chart data (last 30 days)
  const chartData = trendData.slice(-30).map(p => ({
    date: p.date,
    weight: settings.unit === 'lb' ? kgToLb(p.weightKg) : p.weightKg,
    trend: settings.unit === 'lb' ? kgToLb(p.trendKg) : p.trendKg,
  }));

  // Y-axis domain based on unit
  const yAxisDomain = settings.unit === 'lb' ? [150, 250] : [68, 113]; // 150-250 lb = ~68-113 kg

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(weightInput);
    if (isNaN(value)) return;

    const weightKg = settings.unit === 'lb' ? lbToKg(value) : value;
    const selectedDate = new Date(dateInput);
    await addWeighIn(weightKg, selectedDate);
    setWeightInput('');
    setDateInput(format(new Date(), 'yyyy-MM-dd')); // Reset to today
  };

  const toggleUnit = () => {
    updateSettings({ unit: settings.unit === 'kg' ? 'lb' : 'kg' });
  };

  // Calorie status color
  const getCalorieColor = () => {
    if (kcal < -100) return 'text-green-600'; // deficit
    if (kcal > 100) return 'text-red-600'; // surplus
    return 'text-yellow-600'; // maintenance
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">The Body Electric</h1>
          <p className="text-gray-600">Weight Trend Tracker</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Trend (Last 30 Days)</h2>

            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={yAxisDomain} />
                    <Tooltip />
                    <Scatter dataKey="weight" fill="#14b8a6" name="Weight" />
                    <Line
                      type="monotone"
                      dataKey="trend"
                      stroke="#0891b2"
                      strokeWidth={2}
                      name="Trend (EWMA)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Current Weights Display */}
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trend Weight</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {trendWeight ? formatWeight(trendWeight, settings.unit) : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Actual Weight</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {actualWeight ? formatWeight(actualWeight, settings.unit) : '--'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {actualDate || 'No data'}
                    </p>
                  </div>
                </div>

                {/* Weigh-In History */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-3">History</h3>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white border-b border-gray-200">
                        <tr className="text-left text-gray-600">
                          <th className="pb-2">Date</th>
                          <th className="pb-2 text-right">Actual</th>
                          <th className="pb-2 text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...trendData].reverse().map((point) => (
                          <tr key={point.date} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 text-gray-700">{point.date}</td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatWeight(point.weightKg, settings.unit)}
                            </td>
                            <td className="py-2 text-right font-medium text-teal-600">
                              {formatWeight(point.trendKg, settings.unit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data yet. Add your first weigh-in!
              </div>
            )}
          </div>

          {/* Right Column: Form + Stats */}
          <div className="space-y-6">
            {/* Weigh-In Form */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Daily Weigh-In</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight ({settings.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder={`Enter weight in ${settings.unit}`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Add Weigh-In
                </button>
              </form>

              <button
                onClick={toggleUnit}
                className="mt-4 w-full text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Switch to {settings.unit === 'kg' ? 'lb' : 'kg'}
              </button>
            </div>

            {/* Stats Panel */}
            {latestPoint && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Current Stats</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Trend</p>
                    <p className="text-2xl font-bold text-teal-600">
                      {formatWeight(latestPoint.trendKg, settings.unit)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">7-Day Slope</p>
                    <p className="text-lg font-semibold">
                      {formatSlope(slope, settings.unit)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Calorie Delta</p>
                    <p className={`text-lg font-semibold ${getCalorieColor()}`}>
                      {kcal > 0 ? '+' : ''}{Math.round(kcal)} kcal/day
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {kcal < -100 && 'Deficit (losing weight)'}
                      {kcal > 100 && 'Surplus (gaining weight)'}
                      {Math.abs(kcal) <= 100 && 'Maintenance'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      EWMA α = {settings.alpha} • {weighIns.length} weigh-ins recorded
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Part of <a href="https://quarterly.systems" className="text-teal-600 hover:text-teal-700">Quarterly Systems</a></p>
        </footer>
      </div>
    </div>
  );
}

export default App;
