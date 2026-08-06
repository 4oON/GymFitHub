import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, LineChart, User, FileImage } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onNotify: (message: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNotify }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in pb-24 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Hello, <span className="text-emerald-400">Athlete</span>
          </h1>
          <p className="text-slate-400">Ready to crush your goals?</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/profile')}
            className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <User size={24} />
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/workout')}
          className="bg-emerald-500 hover:bg-emerald-400 text-white p-5 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex flex-col items-center gap-3 group"
        >
          <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Dumbbell size={28} className="text-white" />
          </div>
          <span className="font-bold">Start Workout</span>
        </button>

        <button
          onClick={() => navigate('/progress')}
          className="bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl border border-slate-700 transition-all active:scale-95 flex flex-col items-center gap-3 group"
        >
          <div className="bg-slate-700 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <LineChart size={28} className="text-emerald-400" />
          </div>
          <span className="font-bold">Progress</span>
        </button>
      </div>

      {/* WEEKLY REPORTS SECTION */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Weekly Reports</h2>
          <button className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
            View All →
          </button>
        </div>
        <button className="w-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 text-left hover:from-emerald-500/20 hover:to-teal-500/20 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white mb-1">Export Training Reports</h3>
              <p className="text-slate-400 text-sm">Generate SVG, PDF, and PNG reports</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <FileImage size={24} className="text-emerald-400" />
            </div>
          </div>
        </button>
      </div>

      {/* MY ROUTINES SECTION */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">My Routines</h2>
          <button className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
            + Create
          </button>
        </div>
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center">
          <p className="text-slate-400 text-sm">No routines yet. Create your first routine!</p>
        </div>
      </div>

      {/* RECOVERY STATUS */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Recovery Status</h2>
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="grid grid-cols-2 gap-3">
            {[
              { muscle: 'CHEST', percentage: 100 },
              { muscle: 'LATS', percentage: 85 },
              { muscle: 'QUADS', percentage: 60 },
              { muscle: 'GLUTES', percentage: 100 }
            ].map((status) => (
              <div key={status.muscle} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase">{status.muscle}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.percentage > 80
                        ? 'bg-emerald-500'
                        : status.percentage > 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="text-white font-bold">{Math.round(status.percentage)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;