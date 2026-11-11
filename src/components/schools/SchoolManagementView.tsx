import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { School } from '../../types/index.ts';
import {
  Building2,
  Plus,
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

export const SchoolManagementView: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New school form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const res = await api.getSchools();
      setSchools(res.schools);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleToggleStatus = async (school: School) => {
    const nextStatus = school.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateSchoolStatus(school.id, nextStatus);
      setSchools((prev) =>
        prev.map((s) => (s.id === school.id ? { ...s, status: nextStatus as any } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('School name and code are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createSchool({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain: domain.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setSchools((prev) => [...prev, res.school]);
      setShowCreateModal(false);
      setName('');
      setCode('');
      setDomain('');
      setEmail('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      alert(err.message || 'Failed to create school');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Administrator Multi-Campus Authority</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Institutional Tenants Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision campuses, govern tenant data boundaries, and audit educational quotas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New School</span>
        </button>
      </div>

      {/* Grid of registered schools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schools.map((school) => {
          const isActive = school.status === 'active';
          return (
            <div
              key={school.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={school.logo}
                      alt={school.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{school.name}</h2>
                      <div className="text-xs text-slate-500 font-mono">
                        {school.code} · {school.domain}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {school.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Students</span>
                    <div className="font-bold text-slate-900 tabular-nums">{school.studentCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Teachers</span>
                    <div className="font-bold text-slate-900 tabular-nums">{school.teacherCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Examinations</span>
                    <div className="font-bold text-slate-900 tabular-nums">{school.examCount}</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div>
                    <strong>Campus Address:</strong> {school.address}
                  </div>
                  <div>
                    <strong>Contact:</strong> {school.email} · {school.phone}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Provisioned: {new Date(school.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleToggleStatus(school)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {isActive ? 'Suspend Campus' : 'Reactivate Campus'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Provision Educational Institution</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Institution Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. St. Jude Institute of Technology"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Campus Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="E.g. SJIT-501"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Domain</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="sjit.edu"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="registrar@sjit.edu"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Campus address, city, state"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
