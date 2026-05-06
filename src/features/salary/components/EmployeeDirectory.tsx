"use client";

import { useState, useEffect } from "react";
import {
  getEmployees,
  saveEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  formatINR,
} from "../lib/api";
import { SUPPORTED_STATES } from "../lib/engine/statutory";

const emptyForm = {
  name: "",
  email: "",
  employee_code: "",
  designation: "",
  department: "",
  date_of_joining: "",
  annual_ctc: "",
  state: "default",
  gender: "Male",
};

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      // Supabase may not be configured
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.annual_ctc) {
      setError("Name and Annual CTC are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Convert empty strings to null to avoid database type/constraint errors
      const payload = {
        name: form.name,
        email: form.email || null,
        employee_code: form.employee_code || null,
        designation: form.designation || null,
        department: form.department || null,
        date_of_joining: form.date_of_joining || null,
        annual_ctc: parseFloat(form.annual_ctc),
        state: form.state,
        gender: form.gender,
      };

      if (editing) {
        const updated = await updateEmployee(editing, payload as unknown as Partial<Employee>);
        setEmployees((prev) => prev.map((e) => (e.id === editing ? updated : e)));
      } else {
        const created = await saveEmployee(payload as unknown as Omit<Employee, "id" | "created_at" | "updated_at">);
        setEmployees((prev) => [created, ...prev]);
      }
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to save employee: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp: Employee) => {
    setForm({
      name: emp.name,
      email: emp.email || "",
      employee_code: emp.employee_code || "",
      designation: emp.designation || "",
      department: emp.department || "",
      date_of_joining: emp.date_of_joining || "",
      annual_ctc: emp.annual_ctc?.toString() || "",
      state: emp.state || "default",
      gender: emp.gender || "Male",
    });
    setEditing(emp.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Failed to delete employee.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Employee Directory</h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{employees.length} employee{employees.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditing(null);
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2 text-[13px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? "Cancel" : "Add Employee"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 animate-fade-in">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">
            {editing ? "Edit Employee" : "New Employee"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="form-label">Full Name <span className="text-[var(--danger)]">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ravi Kumar" className="input-field" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="ravi@company.com" className="input-field" />
            </div>
            <div>
              <label className="form-label">Employee Code</label>
              <input type="text" name="employee_code" value={form.employee_code} onChange={handleChange} placeholder="EMP001" className="input-field" />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="Software Engineer" className="input-field" />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="Engineering" className="input-field" />
            </div>
            <div>
              <label className="form-label">Date of Joining</label>
              <input type="date" name="date_of_joining" value={form.date_of_joining} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="form-label">Annual CTC <span className="text-[var(--danger)]">*</span></label>
              <input type="number" name="annual_ctc" value={form.annual_ctc} onChange={handleChange} placeholder="e.g. 600000" className="input-field" />
            </div>
            <div>
              <label className="form-label">State</label>
              <select name="state" value={form.state} onChange={handleChange} className="input-field">
                {SUPPORTED_STATES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? "Saving..." : editing ? "Update Employee" : "Save Employee"}
            </button>
            {editing && (
              <button
                onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(false); }}
                className="btn-secondary"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-error mt-4">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Employee List */}
      {employees.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Designation</th>
                <th>Department</th>
                <th className="text-right">CTC</th>
                <th>State</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-medium text-[var(--text-primary)]">{emp.name}</td>
                  <td><span className="badge badge-neutral">{emp.employee_code || "—"}</span></td>
                  <td>{emp.designation || "—"}</td>
                  <td>{emp.department || "—"}</td>
                  <td className="amount">{formatINR(emp.annual_ctc)}/yr</td>
                  <td><span className="text-[12px] text-[var(--text-muted)]">{emp.state || "Default"}</span></td>
                  <td className="text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(emp)} className="p-1.5 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--text-faint)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-[14px] text-[var(--text-muted)]">No employees yet</p>
          <p className="text-[12px] text-[var(--text-faint)] mt-1">Click &ldquo;Add Employee&rdquo; to get started</p>
        </div>
      )}
    </div>
  );
}
