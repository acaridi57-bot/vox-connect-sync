import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, ShieldCheck, Phone, Save, Loader2, RefreshCw,
  Search, Trash2, TrendingUp, UserPlus, Crown, Ban, CheckCircle2,
  Calendar, Euro, AlertTriangle, UserCheck, Globe, Smartphone, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore, getMockUsers } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { AppUser, UserRole, PlanType, SubscriptionStatus } from '@/types/auth';
import type { BillingProvider } from '@/types/billing';

// ── Cross-app revenue ─────────────────────────────────────────────────────────

const CROSS_APP_LABELS: Record<string, string> = {
  djsengine:        'DJSEngine',
  librifree:        'LibriFree',
  gestionescadenze: 'Gestione Scadenze',
  gestionepassword: 'Gestione Password',
  speakeasy:        'Speak & Translate',
};

interface CrossAppData { amount: number; users: number; loading: boolean; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free', trial: 'Trial',
  premium_monthly: 'Premium M', premium_yearly: 'Premium Y',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Attivo', in_trial: 'Trial', expired: 'Scaduto',
  cancelled: 'Cancellato', blocked: 'Bloccato',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  in_trial: 'bg-blue-50 text-blue-700 border-blue-200',
  expired: 'bg-orange-50 text-orange-700 border-orange-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
};

function getRoleBadge(role: UserRole) {
  if (role === 'admin') return <Badge className="bg-green-500 text-white text-xs gap-1"><Shield className="w-3 h-3" />Admin</Badge>;
  if (role === 'user_pro') return <Badge className="bg-yellow-400 text-yellow-900 text-xs gap-1 font-semibold"><Crown className="w-3 h-3" />User Pro</Badge>;
  return <Badge variant="secondary" className="text-xs">User</Badge>;
}

function getPlanBadge(plan: PlanType) {
  if (plan === 'premium_monthly' || plan === 'premium_yearly') {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs gap-1"><Crown className="w-3 h-3" />{PLAN_LABELS[plan]}</Badge>;
  }
  if (plan === 'trial') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Trial</Badge>;
  return <Badge variant="outline" className="text-xs text-muted-foreground">Free</Badge>;
}

function getStatusBadge(status: string) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || STATUS_COLORS.active;
  return <Badge variant="outline" className={`text-xs font-medium ${color}`}>{label}</Badge>;
}

function getProviderBadge(provider?: BillingProvider) {
  if (!provider || provider === 'mock') return <span className="text-muted-foreground text-xs">—</span>;
  if (provider === 'stripe') return <Badge variant="outline" className="text-xs gap-1"><Globe className="w-3 h-3" />Stripe</Badge>;
  if (provider === 'apple') return <Badge variant="outline" className="text-xs gap-1"><Smartphone className="w-3 h-3" />App Store</Badge>;
  if (provider === 'googleplay') return <Badge variant="outline" className="text-xs gap-1"><Smartphone className="w-3 h-3" />Google Play</Badge>;
  return <Badge variant="outline" className="text-xs">{provider}</Badge>;
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yy HH:mm', { locale: it }); } catch { return d.split('T')[0]; }
}

function StatCard({ icon: Icon, label, value, color = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string | number; color?: string;
}) {
  return (
    <Card className="border border-border/60">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className={`p-2 rounded-lg bg-primary/5 ${color}`}><Icon className="w-5 h-5" /></div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Edit form type ────────────────────────────────────────────────────────────

interface EditForm {
  name: string;
  whatsapp: string;
  notifications: boolean;
  role: UserRole;
  plan: PlanType;
  subscriptionStatus: string;
  subscriptionEnd: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { toast } = useToast();
  const currentUser = useAuthStore(s => s.currentUser);

  const [users, setUsers] = useState<AppUser[]>(getMockUsers());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', whatsapp: '', notifications: false,
    role: 'user', plan: 'free', subscriptionStatus: 'active', subscriptionEnd: '',
  });
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'user' as UserRole, plan: 'free' as PlanType });
  const [crossApp, setCrossApp] = useState<Record<string, CrossAppData>>({
    djsengine:        { amount: 0, users: 0, loading: true },
    librifree:        { amount: 0, users: 0, loading: true },
    gestionescadenze: { amount: 0, users: 0, loading: true },
    gestionepassword: { amount: 0, users: 0, loading: true },
    speakeasy:        { amount: 0, users: 0, loading: true },
  });

  // ── Cross-app revenue ───────────────────────────────────────────────────────

  const fetchCrossAppRevenue = useCallback(async () => {
    try {
      const res = await fetch('https://tbqreletxtzaosvyyvnv.supabase.co/functions/v1/stripe-revenue');
      const data = await res.json();
      if (res.ok && data?.revenue) {
        const updated: Record<string, CrossAppData> = {};
        for (const key of Object.keys(CROSS_APP_LABELS)) {
          const d = data.revenue[key];
          updated[key] = { amount: d?.amount ?? 0, users: d?.users ?? 0, loading: false };
        }
        setCrossApp(updated);
      } else {
        setCrossApp(prev => Object.fromEntries(Object.keys(prev).map(k => [k, { amount: 0, users: 0, loading: false }])));
      }
    } catch {
      setCrossApp(prev => Object.fromEntries(Object.keys(prev).map(k => [k, { amount: 0, users: 0, loading: false }])));
    }
  }, []);

  useEffect(() => { fetchCrossAppRevenue(); }, [fetchCrossAppRevenue]);

  // ── Refresh ─────────────────────────────────────────────────────────────────

  const refresh = () => {
    setLoading(true);
    setTimeout(() => { setUsers(getMockUsers()); setLoading(false); }, 600);
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    incassoTotale: users.reduce((s, u) => s + u.totalPaid, 0),
    saldoTotale: users.reduce((s, u) => s + u.balance, 0),
    utentiPaganti: users.filter(u => u.totalPaid > 0).length,
    ultimi30gg: (() => {
      const ago30 = new Date(Date.now() - 30 * 86400000);
      return users.reduce((s, u) => s + u.transactions.filter(t => t.status === 'completed' && new Date(t.date) >= ago30).reduce((a, t) => a + t.amount, 0), 0);
    })(),
    trialAttive: users.filter(u => u.subscriptionStatus === 'in_trial').length,
    scaduti: users.filter(u => u.subscriptionStatus === 'expired').length,
  };

  // ── Filters ─────────────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || u.subscriptionStatus === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  // ── Edit ────────────────────────────────────────────────────────────────────

  const startEditing = (u: AppUser) => {
    setEditingUser(u.id);
    setEditForm({
      name: u.name, whatsapp: u.whatsapp || '',
      notifications: u.notifications, role: u.role,
      plan: u.plan, subscriptionStatus: u.subscriptionStatus,
      subscriptionEnd: u.subscriptionEnd ? u.subscriptionEnd.split('T')[0] : '',
    });
  };

  const saveUser = (userId: string) => {
    setSaving(userId);
    setTimeout(() => {
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        name: editForm.name,
        whatsapp: editForm.whatsapp,
        notifications: editForm.notifications,
        role: editForm.role,
        plan: editForm.plan,
        subscriptionStatus: editForm.subscriptionStatus as SubscriptionStatus,
        subscriptionEnd: editForm.subscriptionEnd || undefined,
      } : u));
      toast({ title: 'Utente aggiornato con successo' });
      setEditingUser(null);
      setSaving(null);
    }, 500);
  };

  const toggleBlock = (u: AppUser) => {
    setBlocking(u.id);
    const newStatus = u.subscriptionStatus === 'blocked' ? 'active' : 'blocked';
    setTimeout(() => {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, subscriptionStatus: newStatus as SubscriptionStatus } : x));
      toast({ title: newStatus === 'blocked' ? 'Utente bloccato' : 'Utente sbloccato' });
      setBlocking(null);
    }, 300);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({ title: 'Utente eliminato' });
  };

  const createUser = () => {
    if (!newUserForm.email) { toast({ title: 'Email obbligatoria', variant: 'destructive' }); return; }
    const newUser: AppUser = {
      id: Date.now().toString(),
      name: newUserForm.name || newUserForm.email,
      email: newUserForm.email,
      role: newUserForm.role,
      notifications: false,
      registeredAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
      plan: newUserForm.plan,
      subscriptionStatus: 'active',
      totalPaid: 0, balance: 0, transactions: [],
    };
    setUsers(prev => [newUser, ...prev]);
    toast({ title: 'Utente creato con successo' });
    setShowNewUser(false);
    setNewUserForm({ name: '', email: '', role: 'user', plan: 'free' });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Gestione Utenti</h1>
            <p className="text-xs text-muted-foreground">Amministra utenti, piani e incassi</p>
          </div>
        </motion.div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="w-4 h-4" />Aggiorna</Button>
          <Button size="sm" onClick={() => setShowNewUser(true)} className="gap-2"><UserPlus className="w-4 h-4" />Nuovo Utente</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard icon={Euro} label="Incasso Totale" value={`€${stats.incassoTotale.toFixed(2)}`} color="text-green-600" />
        <StatCard icon={TrendingUp} label="Saldo Totale" value={`€${stats.saldoTotale.toFixed(2)}`} color="text-blue-600" />
        <StatCard icon={UserCheck} label="Utenti Paganti" value={stats.utentiPaganti} color="text-yellow-600" />
        <StatCard icon={Euro} label="Ultimi 30gg" value={`€${stats.ultimi30gg.toFixed(2)}`} color="text-purple-600" />
        <StatCard icon={Calendar} label="Trial Attive" value={stats.trialAttive} color="text-cyan-600" />
        <StatCard icon={AlertTriangle} label="Scaduti" value={stats.scaduti} color="text-red-500" />
      </div>

      {/* Incassi Tutte le App */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <TrendingUp className="w-4 h-4" /> Incassi Tutte le App
          </div>
          <span className="text-sm font-bold text-primary">
            Totale Generale: €{Object.values(crossApp).reduce((s, d) => s + (d.loading ? 0 : d.amount), 0).toFixed(2)}
          </span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(CROSS_APP_LABELS).map(([key, label]) => {
            const d = crossApp[key];
            return (
              <div key={key} className="rounded-xl border p-4 flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {d?.loading
                  ? <div className="flex items-center gap-2 mt-1"><Loader2 className="w-4 h-4 animate-spin opacity-60" /><span className="text-sm opacity-60">Caricamento...</span></div>
                  : <><p className="text-2xl font-bold text-primary">€{(d?.amount ?? 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">{d?.users ?? 0} utenti paganti</p></>
                }
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filters + Table */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cerca nome o email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tutti i piani" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i piani</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="premium_monthly">Premium M</SelectItem>
              <SelectItem value="premium_yearly">Premium Y</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Attivo</SelectItem>
              <SelectItem value="in_trial">Trial</SelectItem>
              <SelectItem value="cancelled">Cancellato</SelectItem>
              <SelectItem value="blocked">Bloccato</SelectItem>
              <SelectItem value="expired">Scaduto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Ruolo</TableHead>
                <TableHead>Piano</TableHead><TableHead>Provider</TableHead><TableHead>Stato Abb.</TableHead>
                <TableHead>Scadenza</TableHead><TableHead>Tot. Pagato</TableHead><TableHead>Saldo</TableHead>
                <TableHead>WhatsApp</TableHead><TableHead>Notifiche</TableHead>
                <TableHead>Data Reg.</TableHead><TableHead>Ultimo Accesso</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={14} className="py-1 px-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />Utenti Registrati ({filtered.length})</div>
                </TableCell>
              </TableRow>
              {filtered.length === 0
                ? <TableRow><TableCell colSpan={14} className="text-center py-10 text-muted-foreground">Nessun utente trovato</TableCell></TableRow>
                : filtered.map(u => {
                  const isEditing = editingUser === u.id;
                  const isMe = u.id === currentUser?.id;
                  return (
                    <TableRow key={u.id} className={isEditing ? 'bg-primary/5' : ''}>
                      {/* Nome */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${u.role === 'admin' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-primary to-primary/70'}`}>
                            {u.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {u.name}{isMe && <Badge variant="outline" className="ml-1 text-[10px] py-0">Tu</Badge>}
                          </span>
                        </div>
                      </TableCell>
                      {/* Email */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{u.email}</TableCell>
                      {/* Ruolo */}
                      <TableCell>
                        {isEditing
                          ? <Select value={editForm.role} onValueChange={(v: UserRole) => setEditForm({ ...editForm, role: v })}><SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="user_pro">User Pro</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
                          : getRoleBadge(u.role)}
                      </TableCell>
                      {/* Piano */}
                      <TableCell>
                        {isEditing
                          ? <Select value={editForm.plan} onValueChange={(v: PlanType) => setEditForm({ ...editForm, plan: v })}><SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="trial">Trial</SelectItem><SelectItem value="premium_monthly">Premium M</SelectItem><SelectItem value="premium_yearly">Premium Y</SelectItem></SelectContent></Select>
                          : getPlanBadge(u.plan)}
                      </TableCell>
                      {/* Provider */}
                      <TableCell>{getProviderBadge(u.billingProvider)}</TableCell>
                      {/* Stato Abb. */}
                      <TableCell>
                        {isEditing
                          ? <Select value={editForm.subscriptionStatus} onValueChange={v => setEditForm({ ...editForm, subscriptionStatus: v })}><SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Attivo</SelectItem><SelectItem value="in_trial">Trial</SelectItem><SelectItem value="cancelled">Cancellato</SelectItem><SelectItem value="blocked">Bloccato</SelectItem><SelectItem value="expired">Scaduto</SelectItem></SelectContent></Select>
                          : getStatusBadge(u.subscriptionStatus)}
                      </TableCell>
                      {/* Scadenza */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {isEditing
                          ? <Input type="date" value={editForm.subscriptionEnd} onChange={e => setEditForm({ ...editForm, subscriptionEnd: e.target.value })} className="w-32 h-7 text-xs" />
                          : formatDate(u.subscriptionEnd || u.trialEnd)}
                      </TableCell>
                      {/* Tot. Pagato */}
                      <TableCell className="text-xs text-muted-foreground">{u.totalPaid > 0 ? `€${u.totalPaid.toFixed(2)}` : '—'}</TableCell>
                      {/* Saldo */}
                      <TableCell className="text-xs text-muted-foreground">{u.balance > 0 ? `€${u.balance.toFixed(2)}` : '—'}</TableCell>
                      {/* WhatsApp */}
                      <TableCell className="whitespace-nowrap">
                        {isEditing
                          ? <Input value={editForm.whatsapp} onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })} placeholder="+39..." className="w-28 h-7 text-xs" />
                          : <span className="text-xs">{u.whatsapp || <span className="text-muted-foreground">—</span>}</span>}
                      </TableCell>
                      {/* Notifiche */}
                      <TableCell>
                        {isEditing
                          ? <Switch checked={editForm.notifications} onCheckedChange={c => setEditForm({ ...editForm, notifications: c })} />
                          : <Switch checked={u.notifications} disabled />}
                      </TableCell>
                      {/* Data Reg. */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.registeredAt)}</TableCell>
                      {/* Ultimo Accesso */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.lastAccess)}</TableCell>
                      {/* Azioni */}
                      <TableCell className="text-right whitespace-nowrap">
                        {isEditing
                          ? <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)} className="h-7 text-xs">Annulla</Button>
                              <Button size="sm" onClick={() => saveUser(u.id)} disabled={saving === u.id} className="h-7 text-xs gap-1">
                                {saving === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}Salva
                              </Button>
                            </div>
                          : <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => startEditing(u)} className="h-7 text-xs">Modifica</Button>
                              {!isMe && (
                                <Button size="sm" variant="ghost" onClick={() => toggleBlock(u)} disabled={blocking === u.id}
                                  title={u.subscriptionStatus === 'blocked' ? 'Sblocca' : 'Blocca'}
                                  className={`h-7 w-7 p-0 ${u.subscriptionStatus === 'blocked' ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                                  {blocking === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.subscriptionStatus === 'blocked' ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                </Button>
                              )}
                              {!isMe && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Eliminare utente?</AlertDialogTitle><AlertDialogDescription>Stai per eliminare <strong>{u.name}</strong>. Azione irreversibile.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-red-600 hover:bg-red-700">Elimina</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Nuovo Utente Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Nuovo Utente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-sm">Nome completo</Label><Input placeholder="Mario Rossi" value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Email *</Label><Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Ruolo</Label>
                <Select value={newUserForm.role} onValueChange={(v: UserRole) => setNewUserForm({ ...newUserForm, role: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="user_pro">User Pro</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm">Piano</Label>
                <Select value={newUserForm.plan} onValueChange={(v: PlanType) => setNewUserForm({ ...newUserForm, plan: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="trial">Trial</SelectItem><SelectItem value="premium_monthly">Premium M</SelectItem><SelectItem value="premium_yearly">Premium Y</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>Annulla</Button>
            <Button onClick={createUser} className="gap-2"><UserPlus className="w-4 h-4" />Crea Utente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
