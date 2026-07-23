// src/components/admin/Reports.tsx
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchIncomeReport, fetchCustomerFlow } from "../../features/reports/reportsThunks";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer, Legend
} from "recharts";

const Reports: React.FC = () => {
  const dispatch = useAppDispatch();
  const { income, flow, loading, error } = useAppSelector((state) => state.reports);

  useEffect(() => {
    dispatch(fetchIncomeReport());
    dispatch(fetchCustomerFlow());
  }, [dispatch]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-yellow-600 mb-6">📊 Reports Dashboard</h2>

      {loading && <p className="text-gray-500">Loading reports...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Daily Sales Trend */}
      <div className="mb-10">
        <h3 className="font-semibold mb-4">Daily Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={[...income.weekly].reverse()} // ✅ reverse so latest week shows first
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tickFormatter={(weekStr) => {
                const start = new Date(weekStr);
                const end = new Date(start);
                end.setDate(start.getDate() + 6); // add 6 days for end of week
                return `${start.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })} - ${end.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}`;
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(weekStr) => {
                const start = new Date(weekStr);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return `Week: ${start.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })} - ${end.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}`;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#facc15" name="Weekly Income ($)" />
            <Line type="monotone" dataKey="customers" stroke="#2563eb" name="Customers" />
          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* Weekly & Monthly Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div>
          <h3 className="font-semibold mb-4">Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={income.weekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickFormatter={(weekStr) =>
                  new Date(weekStr).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })
                }
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#facc15" name="Income ($)" />
              <Bar dataKey="customers" fill="#2563eb" name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={income.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(monthStr) =>
                  new Date(monthStr).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric"
                  })
                }
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#facc15" name="Income ($)" />
              <Bar dataKey="customers" fill="#2563eb" name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Barber Performance */}
      <div>
        <h3 className="font-semibold mb-4">Barber Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={flow.barbers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="barber_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="customers" fill="#2563eb" name="Customers Served" />
            <Bar dataKey="income" fill="#facc15" name="Income Generated ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
