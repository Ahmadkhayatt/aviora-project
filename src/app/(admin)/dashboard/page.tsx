"use client";

import { useEffect, useState } from "react";
import { store } from "@/infrastructure/database/inMemoryStore";
import type { DashboardSummary } from "@/shared/types";
import { Package, PackageCheck, AlertTriangle, PackageX, Boxes } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    setSummary(store.getDashboardSummary());
  }, []);

  if (!summary) {
    return <div className="flex items-center justify-center py-20 text-charcoal-400">Loading dashboard...</div>;
  }

  const stats = [
    { label: "Total Products", value: summary.totalProducts, icon: Package, color: "text-blue-600 bg-blue-100" },
    { label: "Total Variants", value: summary.totalVariants, icon: Boxes, color: "text-violet-600 bg-violet-100" },
    { label: "In Stock Units", value: summary.totalInventoryUnits, icon: PackageCheck, color: "text-emerald-600 bg-emerald-100" },
    { label: "Low Stock Items", value: summary.lowStockCount, icon: AlertTriangle, color: "text-amber-600 bg-amber-100" },
    { label: "Out of Stock", value: summary.outOfStockCount, icon: PackageX, color: "text-rose-600 bg-rose-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-charcoal-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-charcoal-500">Real-time inventory and product summary.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-luxe">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-charcoal-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-charcoal-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {summary.recentTransactions.length > 0 && (
        <div className="card-luxe">
          <h2 className="mb-4 text-lg font-semibold text-charcoal-900">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-200 text-left text-charcoal-500">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Delta</th>
                  <th className="pb-3 font-medium">Previous</th>
                  <th className="pb-3 font-medium">New</th>
                  <th className="pb-3 font-medium">Note</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-charcoal-100">
                    <td className="py-3">
                      <span className={`badge-luxury ${
                        txn.type === "RESTOCK" ? "bg-emerald-100 text-emerald-700" :
                        txn.type === "SALE" ? "bg-blue-100 text-blue-700" :
                        "bg-charcoal-100 text-charcoal-700"
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={txn.delta > 0 ? "text-emerald-600" : "text-rose-600"}>
                        {txn.delta > 0 ? "+" : ""}{txn.delta}
                      </span>
                    </td>
                    <td className="py-3 text-charcoal-600">{txn.previousQuantity}</td>
                    <td className="py-3 text-charcoal-600">{txn.newQuantity}</td>
                    <td className="py-3 text-charcoal-500">{txn.note}</td>
                    <td className="py-3 text-charcoal-500">{new Date(txn.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
