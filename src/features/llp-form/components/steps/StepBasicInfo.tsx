"use client";

import { useLLPForm } from "../../hooks/useFormContext";

export function StepBasicInfo() {
  const { data, updateField } = useLLPForm();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">LLP Basic Information</h2>
        <p className="text-sm text-slate-500">Enter the name, execution details, and registered address of the LLP.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">LLP Name</label>
          <input
            type="text"
            value={data.llpName}
            onChange={(e) => updateField("llpName", e.target.value)}
            placeholder="e.g. ABC Consultants LLP"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Execution City</label>
          <input
            type="text"
            value={data.executionCity}
            onChange={(e) => updateField("executionCity", e.target.value)}
            placeholder="e.g. Hyderabad"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Execution Date</label>
          <input
            type="text"
            value={data.executionDate}
            onChange={(e) => updateField("executionDate", e.target.value)}
            placeholder="e.g. 12th May, 2025"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Registered Address */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Registered Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Door No / Building</label>
            <input
              type="text"
              value={data.registeredAddress.doorNo}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, doorNo: e.target.value })}
              placeholder="e.g. 1-2-3, Building Name"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Area / Locality</label>
            <input
              type="text"
              value={data.registeredAddress.area}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, area: e.target.value })}
              placeholder="e.g. Banjara Hills"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">District</label>
            <input
              type="text"
              value={data.registeredAddress.district}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, district: e.target.value })}
              placeholder="e.g. Hyderabad"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
            <input
              type="text"
              value={data.registeredAddress.state}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, state: e.target.value })}
              placeholder="e.g. Telangana"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PIN Code</label>
            <input
              type="text"
              value={data.registeredAddress.pin}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, pin: e.target.value })}
              placeholder="e.g. 500034"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
