import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { Examination, ExamSession, InvigilationIncident } from '../../types/index.ts';
import {
  Eye,
  ShieldAlert,
  Clock,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter,
  RefreshCw,
  Send,
} from 'lucide-react';

export const LiveInvigilationConsole: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam_cs_midterm');
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [incidents, setIncidents] = useState<InvigilationIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Incident log modal
  const [selectedSessionForIncident, setSelectedSessionForIncident] = useState<ExamSession | null>(null);
  const [incidentType, setIncidentType] = useState<string>('tab_switch');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [extraTimeInput, setExtraTimeInput] = useState<number>(0);

  const fetchInvigilationData = async () => {
    try {
      const examsRes = await api.getExams();
      setExams(examsRes.exams);
      if (selectedExamId) {
        const data = await api.getInvigilationData(selectedExamId);
        setSessions(data.sessions);
        setIncidents(data.incidents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvigilationData();
    const interval = setInterval(fetchInvigilationData, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, [selectedExamId]);

  const handleGrantExtraTime = async (session: ExamSession, minutes: number) => {
    try {
      await api.logInvigilationIncident(session.id, {
        incidentType: 'extra_time_granted',
        description: `Invigilator granted +${minutes} minutes compensatory time due to technical/proctoring request.`,
        severity: 'low',
        extraTimeMinutes: minutes,
      });
      fetchInvigilationData();
    } catch (e: any) {
      alert(e.message || 'Failed to grant extra time');
    }
  };

  const handleSubmitIncident = async () => {
    if (!selectedSessionForIncident) return;
    try {
      await api.logInvigilationIncident(selectedSessionForIncident.id, {
        incidentType,
        description: incidentDesc || 'Incident logged by invigilator.',
        severity: incidentSeverity,
        extraTimeMinutes: extraTimeInput > 0 ? extraTimeInput : undefined,
      });
      setSelectedSessionForIncident(null);
      setIncidentDesc('');
      setExtraTimeInput(0);
      fetchInvigilationData();
    } catch (e: any) {
      alert(e.message || 'Failed to log incident');
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const filteredSessions = sessions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Exam Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Eye className="w-4 h-4" />
            <span>Real-Time Invigilation & Proctoring Engine</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Live Examination Room</h1>
          <p className="text-xs text-slate-300">
            Active candidate telemetry, live response saving heartbeats, and suspicious activity auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={fetchInvigilationData}
            title="Refresh Room"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Connected Candidates</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{sessions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Real-time sessions</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">In Progress Now</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {sessions.filter((s) => s.status === 'in_progress').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Actively answering</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Submitted & Locked</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
            {sessions.filter((s) => s.status === 'submitted').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated scoring logged</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Flagged Incidents</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{incidents.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged proctoring events</div>
        </div>
      </div>

      {/* Main Grid: Active Candidate Table & Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Roster (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Candidate Session Monitor</h2>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Time Left</th>
                    <th className="py-3 px-4">Tab Switches</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active sessions matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => {
                      const totalQ = selectedExam?.questions.length || 7;
                      const answeredQ = Object.keys(s.answers || {}).length;
                      const isSubmitted = s.status === 'submitted';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{s.studentName}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {s.studentRollNumber} · IP: {s.ipAddress || '127.0.0.1'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Submitted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                In Progress
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums">
                            <div className="font-medium text-slate-800">
                              {answeredQ} / {totalQ} Qs
                            </div>
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.round((answeredQ / totalQ) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700 tabular-nums">
                            {isSubmitted
                              ? 'Finished'
                              : `${Math.floor(s.timeRemainingSeconds / 60)}m ${s.timeRemainingSeconds % 60}s`}
                            {s.extraTimeMinutes > 0 && (
                              <span className="block text-[10px] text-indigo-600 font-sans">
                                +{s.extraTimeMinutes}m granted
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums">
                            {s.tabSwitches > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {s.tabSwitches} switches
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isSubmitted && (
                                <button
                                  onClick={() => handleGrantExtraTime(s, 5)}
                                  className="px-2 py-1 text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors"
                                  title="Add 5 minutes extra time"
                                >
                                  +5m
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedSessionForIncident(s)}
                                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                              >
                                Incident
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Proctoring Incidents Feed (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Incident & Audit Stream</h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            {incidents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active incidents recorded for this examination session.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{inc.studentName}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          inc.severity === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : inc.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {inc.incidentType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{inc.description}</p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(inc.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Incident Logging Modal */}
      {selectedSessionForIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-indigo-600">Invigilator Incident Form</div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Report Incident: {selectedSessionForIncident.studentName}
              </h3>
              <p className="text-xs text-slate-500">
                Log behavioral notes, technical disruptions, or grant compensatory examination time.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Incident Classification</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="tab_switch">Unscheduled Window / Tab Switch</option>
                  <option value="connectivity_loss">Temporary Connectivity Loss</option>
                  <option value="suspicious_behavior">Suspicious Proctoring Behavior</option>
                  <option value="extra_time_granted">Compensatory Extra Time Request</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Severity Level</label>
                <div className="flex items-center gap-2">
                  {(['low', 'medium', 'high'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setIncidentSeverity(sev)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                        incidentSeverity === sev
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Compensatory Extra Time (Minutes, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={extraTimeInput}
                  onChange={(e) => setExtraTimeInput(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Describe observed event and resolution..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedSessionForIncident(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIncident}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Record Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
