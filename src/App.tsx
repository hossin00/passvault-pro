import { useState, useEffect } from 'react';
import { Key, Plus, Search, Lock, Eye, EyeOff, Copy, Trash2, Edit2, Shield, RefreshCw, X } from 'lucide-react';
import CryptoJS from 'crypto-js';

interface Password {
  id: string;
  site: string;
  username: string;
  password: string;
  category: string;
  createdAt: number;
}

const STORAGE_KEY = 'pv_data';
const HASH_KEY = 'pv_hash';
const CATEGORIES = ['Social', 'Work', 'Finance', 'Shopping', 'Email', 'Other'];

const hashPwd = (p: string) => CryptoJS.SHA256(p + 'pv_salt_2024').toString();
const encrypt = (data: string, pwd: string) => CryptoJS.AES.encrypt(data, pwd).toString();
const decrypt = (enc: string, pwd: string) => {
  try {
    const b = CryptoJS.AES.decrypt(enc, pwd);
    return b.toString(CryptoJS.enc.Utf8) || null;
  } catch { return null; }
};

const generatePassword = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length]).join('');
};

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [masterPwd, setMasterPwd] = useState('');
  const [pwdInput, setPwdInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Password | null>(null);
  const [visiblePwds, setVisiblePwds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState('');

  useEffect(() => { setHasPassword(!!localStorage.getItem(HASH_KEY)); }, []);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPassword) {
      if (pwdInput.length < 4) { setError('Min 4 characters'); return; }
      if (pwdInput !== confirmInput) { setError('Passwords do not match'); return; }
      localStorage.setItem(HASH_KEY, hashPwd(pwdInput));
      setMasterPwd(pwdInput);
      setHasPassword(true);
      setIsUnlocked(true);
    } else {
      if (hashPwd(pwdInput) !== localStorage.getItem(HASH_KEY)) { setError('Wrong password'); setPwdInput(''); return; }
      const enc = localStorage.getItem(STORAGE_KEY);
      if (enc) {
        const dec = decrypt(enc, pwdInput);
        if (dec) setPasswords(JSON.parse(dec));
      }
      setMasterPwd(pwdInput);
      setIsUnlocked(true);
    }
  };

  const save = (items: Password[]) => {
    setPasswords(items);
    localStorage.setItem(STORAGE_KEY, encrypt(JSON.stringify(items), masterPwd));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const toggleVisible = (id: string) => {
    setVisiblePwds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filtered = passwords.filter(p =>
    p.site.toLowerCase().includes(search.toLowerCase()) ||
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!isUnlocked) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-6">
            <Key className="w-9 h-9 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PassVault</h1>
          <p className="text-slate-400 text-sm">{hasPassword ? 'Enter master password' : 'Create your master password'}</p>
        </div>
        <form onSubmit={unlock} className="space-y-4">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={pwdInput} onChange={e => setPwdInput(e.target.value)}
              placeholder={hasPassword ? 'Master password' : 'Create master password'}
              className="w-full bg-[#111827] border border-[#1e3a8a] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-12" autoFocus />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {!hasPassword && (
            <input type={showPwd ? 'text' : 'password'} value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
              placeholder="Confirm password" className="w-full bg-[#111827] border border-[#1e3a8a] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          )}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors">
            {hasPassword ? 'Unlock' : 'Create Vault'}
          </button>
        </form>
        <div className="mt-8 flex items-center gap-2 text-slate-500 text-xs justify-center">
          <Shield className="w-4 h-4" />
          <span>AES-256 encrypted • Local only • Never synced</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <header className="border-b border-[#1e3a8a]/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-white">PassVault</span>
          <span className="text-slate-500 text-sm">{passwords.length} passwords</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
          <button onClick={() => { setIsUnlocked(false); setMasterPwd(''); setPasswords([]); }} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-[#111827] rounded-lg transition-colors">
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search passwords..."
            className="w-full bg-[#111827] border border-[#1e3a8a]/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No passwords yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-[#111827] border border-[#1e3a8a]/30 rounded-xl p-4 hover:border-blue-500/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{item.site}</span>
                      <span className="text-xs text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded-full">{item.category}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{item.username}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm font-mono">
                        {visiblePwds.has(item.id) ? item.password : '•'.repeat(Math.min(item.password.length, 12))}
                      </span>
                      <button onClick={() => toggleVisible(item.id)} className="text-slate-500 hover:text-slate-300">
                        {visiblePwds.has(item.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => copyToClipboard(item.password, item.id)} className="text-slate-500 hover:text-blue-400">
                        <Copy className="w-4 h-4" />
                      </button>
                      {copied === item.id && <span className="text-green-400 text-xs">Copied!</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditItem(item)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => save(passwords.filter(p => p.id !== item.id))} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showAdd || editItem) && (
        <AddModal
          item={editItem}
          onSave={item => {
            const exists = passwords.find(p => p.id === item.id);
            save(exists ? passwords.map(p => p.id === item.id ? item : p) : [item, ...passwords]);
            setShowAdd(false); setEditItem(null);
          }}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

function AddModal({ item, onSave, onClose }: { item: Password | null; onSave: (p: Password) => void; onClose: () => void }) {
  const [site, setSite] = useState(item?.site || '');
  const [username, setUsername] = useState(item?.username || '');
  const [password, setPassword] = useState(item?.password || '');
  const [category, setCategory] = useState(item?.category || 'Other');
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#111827] border border-[#1e3a8a]/50 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">{item ? 'Edit Password' : 'Add Password'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input value={site} onChange={e => setSite(e.target.value)} placeholder="Website / App name"
            className="w-full bg-[#0a0f1e] border border-[#1e3a8a]/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username / Email"
            className="w-full bg-[#0a0f1e] border border-[#1e3a8a]/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
              className="w-full bg-[#0a0f1e] border border-[#1e3a8a]/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm pr-20" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-slate-500 hover:text-slate-300 p-1">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setPassword(generatePassword())} className="text-slate-500 hover:text-blue-400 p-1">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-[#0a0f1e] border border-[#1e3a8a]/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => { if (!site || !password) return; onSave({ id: item?.id || crypto.randomUUID(), site, username, password, category, createdAt: item?.createdAt || Date.now() }); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
            {item ? 'Save Changes' : 'Add Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
