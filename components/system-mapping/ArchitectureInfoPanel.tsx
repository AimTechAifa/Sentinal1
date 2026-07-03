"use client";

import { AlertTriangle, Info, Map as MapIcon, Share2 } from "lucide-react";

export function ArchitectureInfoPanel() {
  return (
    <div className="bg-white rounded-xl shadow-theme-lg border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-600" /> Architecture Insights
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Release Manager Notes */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Release Manager Notes
          </h4>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-2">
            <p><strong>1.</strong> Always check Integration Matrix before scheduling cross-department releases.</p>
            <p><strong>2.</strong> Shared environments (FIN-TEST-01, IT-TEST-01, INTEG-01) require advance booking.</p>
            <p><strong>3.</strong> Critical Integration Paths require coordinated testing across all connected systems.</p>
            <p><strong>4.</strong> Month-end, Quarter-end, and Year-end are high-risk periods - minimize changes.</p>
            <p><strong>5.</strong> Security systems require 24/7 availability - schedule carefully.</p>
            <p><strong>6.</strong> SAP S/4HANA is the central hub - any SAP changes impact multiple departments.</p>
          </div>
        </section>

        {/* Shared Environments */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" /> Key Shared Environments
          </h4>
          <div className="space-y-2">
            {[
              { env: "FIN-TEST-01", depts: "Finance, Legal, CRM", risk: "HIGH" },
              { env: "FIN-UAT-01", depts: "Finance, Legal, Mfg", risk: "HIGH" },
              { env: "IT-TEST-01", depts: "IT, Security, All", risk: "HIGH" },
              { env: "INTEG-01", depts: "ALL DEPARTMENTS", risk: "CRITICAL" },
            ].map(item => (
              <div key={item.env} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-900">{item.env}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.risk === 'CRITICAL' ? 'bg-error-100 text-error-700' : 'bg-warning-100 text-warning-700'}`}>
                    {item.risk} RISK
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">Shared by: {item.depts}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Critical Integration Paths */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MapIcon className="w-3.5 h-3.5" /> Critical Integration Paths
          </h4>
          <div className="space-y-3">
            {[
              { id: "PATH-001", name: "Order-to-Cash", path: "Salesforce → SAP → Logistics", note: "Revenue impacting" },
              { id: "PATH-002", name: "Procure-to-Pay", path: "SAP → Coupa → Banking", note: "Month-end critical" },
              { id: "PATH-003", name: "Hire-to-Retire", path: "Workday → Okta → All Apps", note: "HR+IT coord required" },
              { id: "PATH-005", name: "Plan-to-Produce", path: "SAP → MES → WMS", note: "Supply chain risk" },
            ].map(path => (
              <div key={path.id} className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">{path.name}</span>
                  <span className="font-mono text-[10px] text-gray-400">{path.id}</span>
                </div>
                <div className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded">
                  {path.path}
                </div>
                <span className="text-[11px] text-gray-500 italic">{path.note}</span>
              </div>
            ))}
          </div>
        </section>
        
      </div>
    </div>
  );
}
