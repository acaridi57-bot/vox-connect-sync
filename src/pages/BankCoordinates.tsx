import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark, ShieldCheck, Plus, Edit2, Trash2, Save, X,
  CreditCard, ScrollText, History, ArrowLeft, Building2, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const LS_KEY = 'speaklive_bank_accounts';
const LS_TXN_KEY = 'speaklive_bank_transactions';
const LS_LOG_KEY = 'speaklive_admin_logs';

interface BankAccount {
  id: string;
  holder: string;
  bankName: string;
  iban: string;
  bic: string;
  accountNumber?: string;
  notes?: string;
  createdAt: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrata' | 'uscita';
}

interface AdminLog {
  id: string;
  date: string;
  action: string;
  user: string;
}

const EMPTY_FORM = { holder: '', bankName: '', iban: '', bic: '', accountNumber: '', notes: '' };

export default function BankCoordinates() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions] = useState<BankTransaction[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copied, setCopied] = useState<string | null>(null);

  // Admin check
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setAccounts(JSON.parse(saved));
      const savedLogs = localStorage.getItem(LS_LOG_KEY);
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    } catch {}
  }, [isAdmin]);

  const saveToStorage = (updated: BankAccount[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setAccounts(updated);
  };

  const addLog = (action: string) => {
    const entry: AdminLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      action,
      user: currentUser?.email || 'admin',
    };
    const updated = [entry, ...logs].slice(0, 100);
    setLogs(updated);
    localStorage.setItem(LS_LOG_KEY, JSON.stringify(updated));
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const handleOpenAdd = () => { resetForm(); setFormOpen(true); };

  const handleEdit = (acc: BankAccount) => {
    setEditingId(acc.id);
    setForm({ holder: acc.holder, bankName: acc.bankName, iban: acc.iban, bic: acc.bic, accountNumber: acc.accountNumber || '', notes: acc.notes || '' });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.holder.trim() || !form.iban.trim()) {
      toast.error('Intestatario e IBAN sono obbligatori');
      return;
    }
    if (editingId) {
      const updated = accounts.map(a => a.id === editingId ? { ...a, ...form } : a);
      saveToStorage(updated);
      addLog(`Coordinate bancarie modificate: ${form.iban}`);
      toast.success('Coordinate aggiornate ✅');
    } else {
      const newAcc: BankAccount = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() };
      const updated = [...accounts, newAcc];
      saveToStorage(updated);
      addLog(`Nuove coordinate aggiunte: ${form.iban}`);
      toast.success('Coordinate bancarie salvate ✅');
    }
    setFormOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!window.confirm('Eliminare questa coordinata bancaria?')) return;
    const updated = accounts.filter(a => a.id !== id);
    saveToStorage(updated);
    addLog(`Coordinate eliminate: ${acc?.iban}`);
    toast.success('Coordinata eliminata');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success(`${label} copiato!`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const maskIban = (iban: string) =>
    iban.length > 8 ? `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}` : iban;

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Indietro
            </Button>
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">I Miei Dati Bancari</h1>
                <p className="text-xs text-muted-foreground">Gestione coordinate bancarie e transazioni — Solo Admin</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs border-primary/40 text-primary">
            <ShieldCheck className="w-3 h-3" />
            Area Protetta Admin
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="coordinate">
          <TabsList className="mb-6">
            <TabsTrigger value="coordinate" className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Coordinate
            </TabsTrigger>
            <TabsTrigger value="transazioni" className="gap-1.5">
              <ScrollText className="w-3.5 h-3.5" /> Transazioni
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5">
              <History className="w-3.5 h-3.5" /> Log
            </TabsTrigger>
          </TabsList>

          {/* ── COORDINATE TAB ── */}
          <TabsContent value="coordinate" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Coordinate Bancarie
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">Le tue coordinate per ricevere pagamenti</CardDescription>
                  </div>
                  {accounts.length > 0 && (
                    <Button size="sm" variant="outline" onClick={handleOpenAdd} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Aggiungi
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Landmark className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">Nessuna coordinata bancaria configurata.</p>
                    <Button onClick={handleOpenAdd} className="gap-1.5">
                      <Plus className="w-4 h-4" /> Aggiungi ora
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accounts.map(acc => (
                      <div key={acc.id} className="rounded-xl border border-border p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-semibold text-sm">{acc.holder}</p>
                              <p className="text-xs text-muted-foreground">{acc.bankName || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => handleEdit(acc)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => handleDelete(acc.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-background rounded-lg p-3 border border-border/60">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">IBAN</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-sm font-medium">{maskIban(acc.iban)}</p>
                              <button onClick={() => handleCopy(acc.iban, 'IBAN')} className="text-muted-foreground hover:text-foreground transition-colors">
                                {copied === 'IBAN' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          {acc.bic && (
                            <div className="bg-background rounded-lg p-3 border border-border/60">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">BIC/SWIFT</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm font-medium">{acc.bic}</p>
                                <button onClick={() => handleCopy(acc.bic, 'BIC')} className="text-muted-foreground hover:text-foreground transition-colors">
                                  {copied === 'BIC' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          )}
                          {acc.accountNumber && (
                            <div className="bg-background rounded-lg p-3 border border-border/60">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">N. Conto</p>
                              <p className="font-mono text-sm font-medium">{acc.accountNumber}</p>
                            </div>
                          )}
                          {acc.notes && (
                            <div className="bg-background rounded-lg p-3 border border-border/60 sm:col-span-2">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Note</p>
                              <p className="text-sm">{acc.notes}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Aggiunto il {new Date(acc.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add/Edit Form */}
            {formOpen && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{editingId ? 'Modifica coordinata' : 'Nuova coordinata bancaria'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="holder" className="text-xs">Intestatario conto *</Label>
                      <Input id="holder" placeholder="Mario Rossi" value={form.holder}
                        onChange={e => setForm(f => ({ ...f, holder: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bankName" className="text-xs">Nome banca</Label>
                      <Input id="bankName" placeholder="Intesa Sanpaolo" value={form.bankName}
                        onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="iban" className="text-xs">IBAN *</Label>
                      <Input id="iban" placeholder="IT60X0542811101000000123456" value={form.iban}
                        onChange={e => setForm(f => ({ ...f, iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                        className="h-9 text-sm font-mono" maxLength={34} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bic" className="text-xs">BIC/SWIFT</Label>
                      <Input id="bic" placeholder="BCITITMM" value={form.bic}
                        onChange={e => setForm(f => ({ ...f, bic: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                        className="h-9 text-sm font-mono" maxLength={11} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="accountNumber" className="text-xs">Numero conto corrente</Label>
                      <Input id="accountNumber" placeholder="000000123456" value={form.accountNumber}
                        onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} className="h-9 text-sm font-mono" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="notes" className="text-xs">Note</Label>
                      <Textarea id="notes" placeholder="Note aggiuntive, codici riferimento..." value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-sm min-h-[70px] resize-y" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">⚠️ I dati bancari sono protetti e visibili solo agli amministratori.</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSave} className="gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Salva
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }} className="gap-1.5">
                      <X className="w-3.5 h-3.5" /> Annulla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── TRANSAZIONI TAB ── */}
          <TabsContent value="transazioni">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ScrollText className="w-4 h-4" /> Transazioni
                </CardTitle>
                <CardDescription>Storico movimenti bancari</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ScrollText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nessuna transazione registrata.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('it-IT')}</p>
                        </div>
                        <p className={`text-sm font-semibold ${t.type === 'entrata' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'entrata' ? '+' : '-'}€{t.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LOG TAB ── */}
          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" /> Log Attività
                </CardTitle>
                <CardDescription>Registro modifiche coordinate bancarie</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nessuna attività registrata.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div>
                          <p className="text-sm">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.user}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.date).toLocaleString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
