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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">LLP Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.llpName}
              onChange={(e) => updateField("llpName", e.target.value)}
              placeholder="e.g. ABC Consultants LLP"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">Execution City</label>
            <input
              type="text"
              value={data.executionCity}
              onChange={(e) => updateField("executionCity", e.target.value)}
              placeholder="e.g. Hyderabad"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">Execution Date</label>
            <input
              type="text"
              value={data.executionDate}
              onChange={(e) => updateField("executionDate", e.target.value)}
              placeholder="e.g. 12th May, 2025"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
        </div>
      </div>

      {/* Registered Address */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400">
        <h3 className="font-bold text-navy-950 text-base mb-5 pb-3 border-b border-slate-100">Registered Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">Door No / Building</label>
            <input
              type="text"
              value={data.registeredAddress.doorNo}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, doorNo: e.target.value })}
              placeholder="e.g. 1-2-3, Building Name"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">Area / Locality</label>
            <input
              type="text"
              value={data.registeredAddress.area}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, area: e.target.value })}
              placeholder="e.g. Banjara Hills"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">District</label>
            <input
              type="text"
              value={data.registeredAddress.district}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, district: e.target.value })}
              placeholder="e.g. Hyderabad"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">State</label>
            <input
              type="text"
              value={data.registeredAddress.state}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, state: e.target.value })}
              placeholder="e.g. Telangana"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">PIN Code</label>
            <input
              type="text"
              value={data.registeredAddress.pin}
              onChange={(e) => updateField("registeredAddress", { ...data.registeredAddress, pin: e.target.value })}
              placeholder="e.g. 500034"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
