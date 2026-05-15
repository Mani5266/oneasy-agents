"use client";

import { useLLPForm } from "../../hooks/useFormContext";
import { blankPartner, type Partner, type Salutation, type RelationDescriptor } from "@/features/llp/types";

export function StepPartners() {
  const { data, setData } = useLLPForm();

  const updatePartner = (index: number, field: keyof Partner, value: any) => {
    setData((prev) => {
      const partners = [...prev.partners];
      partners[index] = { ...partners[index], [field]: value };
      return { ...prev, partners };
    });
  };

  const updatePartnerAddress = (index: number, field: string, value: string) => {
    setData((prev) => {
      const partners = [...prev.partners];
      partners[index] = {
        ...partners[index],
        address: { ...partners[index].address, [field]: value },
      };
      return { ...prev, partners };
    });
  };

  const addPartner = () => {
    setData((prev) => ({
      ...prev,
      numPartners: prev.numPartners + 1,
      partners: [...prev.partners, blankPartner(prev.numPartners)],
      contributions: [...prev.contributions, { partnerIndex: prev.numPartners, percentage: 0, amount: 0 }],
      profits: [...prev.profits, { partnerIndex: prev.numPartners, percentage: 0 }],
    }));
  };

  const removePartner = (index: number) => {
    if (data.numPartners <= 2) return;
    setData((prev) => {
      const partners = prev.partners.filter((_, i) => i !== index).map((p, i) => ({ ...p, index: i }));
      const contributions = prev.contributions.filter((_, i) => i !== index).map((c, i) => ({ ...c, partnerIndex: i }));
      const profits = prev.profits.filter((_, i) => i !== index).map((p, i) => ({ ...p, partnerIndex: i }));
      return { ...prev, numPartners: prev.numPartners - 1, partners, contributions, profits };
    });
  };

  const salutations: Salutation[] = ["Mr.", "Mrs.", "Ms.", "Dr."];
  const relations: RelationDescriptor[] = ["S/O", "D/O", "W/O", "C/O"];

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Partner Details</h2>
          <p className="text-sm text-slate-500">Add all partners with their personal details.</p>
        </div>
        <button
          onClick={addPartner}
          className="px-3 py-1.5 text-xs font-semibold bg-gold-50 text-gold-700 border border-gold-200 rounded-lg hover:bg-gold-100 transition-all"
        >
          + Add Partner
        </button>
      </div>

      {data.partners.map((partner, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-navy-950 text-base">Partner {i + 1}</h3>
            {data.numPartners > 2 && (
              <button onClick={() => removePartner(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">Salutation</label>
              <select value={partner.salutation} onChange={(e) => updatePartner(i, "salutation", e.target.value)} className={inputClass}>
                {salutations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">Full Name<span className="text-red-500">*</span></label>
              <input type="text" value={partner.fullName} onChange={(e) => updatePartner(i, "fullName", e.target.value)} placeholder="Full name as on Aadhaar" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">Relation</label>
              <select value={partner.relationDescriptor} onChange={(e) => updatePartner(i, "relationDescriptor", e.target.value)} className={inputClass}>
                {relations.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">Father Salutation</label>
              <select value={partner.fatherSalutation} onChange={(e) => updatePartner(i, "fatherSalutation", e.target.value)} className={inputClass}>
                {salutations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">Father / Spouse Name<span className="text-red-500">*</span></label>
              <input type="text" value={partner.fatherName} onChange={(e) => updatePartner(i, "fatherName", e.target.value)} placeholder="Father's / Spouse's full name" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">DOB (DD/MM/YYYY)<span className="text-red-500">*</span></label>
              <input type="text" value={partner.dob} onChange={(e) => updatePartner(i, "dob", e.target.value)} placeholder="01/01/1990" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-950 mb-1.5">Age</label>
              <input type="text" value={partner.age} onChange={(e) => updatePartner(i, "age", e.target.value)} placeholder="35" className={inputClass} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-navy-950 mb-3">Residential Address<span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Door No</label>
                <input type="text" value={partner.address.doorNo} onChange={(e) => updatePartnerAddress(i, "doorNo", e.target.value)} placeholder="Door No" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Area / Locality</label>
                <input type="text" value={partner.address.area} onChange={(e) => updatePartnerAddress(i, "area", e.target.value)} placeholder="Area / Locality" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                <input type="text" value={partner.address.city} onChange={(e) => updatePartnerAddress(i, "city", e.target.value)} placeholder="City" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">District</label>
                <input type="text" value={partner.address.district} onChange={(e) => updatePartnerAddress(i, "district", e.target.value)} placeholder="District" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
                <input type="text" value={partner.address.state} onChange={(e) => updatePartnerAddress(i, "state", e.target.value)} placeholder="State" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PIN Code</label>
                <input type="text" value={partner.address.pin} onChange={(e) => updatePartnerAddress(i, "pin", e.target.value)} placeholder="PIN Code" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={partner.isDesignatedPartner} onChange={(e) => updatePartner(i, "isDesignatedPartner", e.target.checked)} className="rounded border-slate-300 text-gold-600 focus:ring-gold-500" />
              <span className="text-slate-700">Designated Partner</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={partner.isManagingPartner} onChange={(e) => updatePartner(i, "isManagingPartner", e.target.checked)} className="rounded border-slate-300 text-gold-600 focus:ring-gold-500" />
              <span className="text-slate-700">Managing Partner</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={partner.isBankAuthorised} onChange={(e) => updatePartner(i, "isBankAuthorised", e.target.checked)} className="rounded border-slate-300 text-gold-600 focus:ring-gold-500" />
              <span className="text-slate-700">Bank Authorised</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
