import React, { useState } from 'react';
import { UserProfile, UserRole, DoorDevice } from '../types/telecommand';
import {
  Users,
  Shield,
  KeyRound,
  UserCheck,
  UserPlus,
  X,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  doors: DoorDevice[];
  onSwitchUser: (user: UserProfile) => void;
  onAddUser: (user: UserProfile) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  doors,
  onSwitchUser,
  onAddUser,
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('member');
  const [selectedDoorIds, setSelectedDoorIds] = useState<string[]>(doors.map((d) => d.id));

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      assignedDoorIds: selectedDoorIds,
    };

    onAddUser(newUser);
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const toggleDoorSelection = (doorId: string) => {
    setSelectedDoorIds((prev) =>
      prev.includes(doorId) ? prev.filter((id) => id !== doorId) : [...prev, doorId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 my-8 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Team Access & Role-Based Control (RBAC)
              </h3>
              <p className="text-xs text-slate-400">
                Manage who can trigger specific doors and control telecommand privileges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Switcher Bar */}
        <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentUser.name}</span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                      : currentUser.role === 'manager'
                      ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">{currentUser.email}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 block font-mono">AUTHORIZED DOORS</span>
            <span className="text-xs font-semibold text-cyan-400">
              {currentUser.role === 'admin' ? 'All System Doors' : `${currentUser.assignedDoorIds.length} Doors`}
            </span>
          </div>
        </div>

        {/* User List */}
        {!isAddingUser ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Switch Active Session or Manage Roles
              </span>
              <button
                onClick={() => setIsAddingUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              {allUsers.map((user) => {
                const isActive = user.id === currentUser.id;

                return (
                  <div
                    key={user.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{user.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            · {user.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <UserCheck className="w-4 h-4" /> Active Now
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchUser(user)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                        >
                          Switch User
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Add User Form */
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. David Miller"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. david@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Role Level</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'admin', label: 'Administrator', desc: 'Full control & crypto vault' },
                  { id: 'manager', label: 'Facility Manager', desc: 'Can trigger & view logs' },
                  { id: 'member', label: 'Team Member', desc: 'Trigger assigned doors only' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setNewUserRole(r.id as UserRole)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newUserRole === r.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">{r.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Permitted Doors / Gates
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {doors.map((door) => (
                  <button
                    key={door.id}
                    type="button"
                    onClick={() => toggleDoorSelection(door.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs flex items-center justify-between transition-all ${
                      selectedDoorIds.includes(door.id)
                        ? 'bg-cyan-950/30 border-cyan-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="truncate">{door.name}</span>
                    {selectedDoorIds.includes(door.id) && (
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md"
              >
                Save Member
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
