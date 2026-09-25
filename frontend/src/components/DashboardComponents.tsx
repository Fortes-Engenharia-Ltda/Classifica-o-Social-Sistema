import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, compact = false }) => (
  <div className={`dashboard-stat-card bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 lg:p-6 shadow-sm border-l-4 ${color} ${compact ? 'dashboard-stat-card--compact' : ''}`}>
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{label}</p>
        <p className={`dashboard-stat-value mt-1.5 font-bold leading-tight text-gray-900 dark:text-white ${compact ? 'text-[clamp(1.1rem,1.6vw,1.6rem)]' : 'text-[clamp(1.3rem,2.1vw,1.95rem)]'}`}>
          {value}
        </p>
      </div>
      <span className={`dashboard-stat-icon ml-2 shrink-0 leading-none ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>{icon}</span>
    </div>
  </div>
);

interface ChartData {
  name: string;
  value: number;
}

interface DashboardChartProps {
  title: string;
  data: ChartData[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ title, data }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#0ea5e9" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
