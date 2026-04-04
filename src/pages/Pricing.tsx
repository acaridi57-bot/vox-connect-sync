import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, Star, Zap, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';

const features = [
  { name: 'Traduzioni voce', free: '3/giorno', premium: 'Illimitate' },
  { name: 'Traduzioni foto', free: '1/giorno', premium: 'Illimitate' },
  { name: 'Traduzioni PDF', free: false, premium: true },
  { name: 'Cronologia', free: 'Ultime 5', premium: 'Completa' },
  { name: 'Accesso offline', free: false, premium: true },
  { name: 'Supporto prioritario', free: false, premium: true },
];

export default function Pricing() {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const currentPlan = currentUser?.plan || 'free';
  const [, setSelectedPlan] = useState<string | null>(null);

  const handleSelect = (plan: string) => {
    setSelectedPlan(plan);
    navigate(`/checkout?plan=${plan}`);
  };

  const renderFeatureValue = (value: string | boolean) => {
    if (value === true) return <Check size={16} className="text-primary mx-auto" />;
    if (value === false) return <X size={16} className="text-muted-foreground mx-auto" />;
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Indietro
        </Button>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Scegli il tuo piano <span className="text-primary">SpeakLiveTranslate</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-4">
            Inizia con 14 giorni di prova gratuita Premium, poi scegli il piano più adatto a te.
          </p>
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 text-sm font-medium">
            <Zap size={14} className="mr-1 inline" />
            14 giorni di prova gratuita Premium
          </Badge>
        </div>

        {/* Plans */}
        <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Free */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star size={20} className="text-muted-foreground" /> Free
              </CardTitle>
              <CardDescription>Dopo il trial</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">€0</p>
              <p className="text-sm text-muted-foreground mb-4">per sempre</p>
              {currentPlan === 'free' && (
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/30">Piano attuale</Badge>
              )}
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  3 traduzioni voce/giorno
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  1 traduzione foto/giorno
                </li>
                <li className="flex gap-2 items-start">
                  <X size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Nessun PDF</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Cronologia ultime 5
                </li>
                <li className="flex gap-2 items-start">
                  <X size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">No priorità supporto</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Continua con Free
              </Button>
            </CardContent>
          </Card>

          {/* Premium Mensile */}
          <Card className="relative border-primary/40 shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3">MOST POPULAR</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown size={20} className="text-primary" /> Premium Mensile
              </CardTitle>
              <CardDescription>Accesso completo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">€5,99</p>
              <p className="text-sm text-muted-foreground mb-4">al mese</p>
              {currentPlan === 'premium_monthly' && (
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/30">Piano attuale</Badge>
              )}
              <Badge variant="outline" className="mb-3 bg-amber-50 text-amber-700 border-amber-200 block w-fit">
                14 giorni gratis
              </Badge>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Traduzioni voce illimitate
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Foto e PDF illimitati
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Cronologia completa
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Supporto prioritario
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Accesso offline
                </li>
              </ul>
              <Button className="w-full" onClick={() => handleSelect('premium_monthly')}>
                Inizia la prova gratuita
              </Button>
            </CardContent>
          </Card>

          {/* Premium Annuale */}
          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-500 text-white px-3">BEST VALUE</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown size={20} className="text-amber-500" /> Premium Annuale
              </CardTitle>
              <CardDescription>Risparmia il 44%</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">€39,99</p>
              <p className="text-sm text-muted-foreground mb-1">all'anno</p>
              <p className="text-xs text-primary font-medium mb-4">€3,33/mese — risparmi 44%</p>
              {currentPlan === 'premium_yearly' && (
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/30">Piano attuale</Badge>
              )}
              <Badge variant="outline" className="mb-3 bg-amber-50 text-amber-700 border-amber-200 block w-fit">
                14 giorni gratis
              </Badge>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Tutto di Premium Mensile
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Risparmio di €31,89/anno
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Funzionalità esclusive
                </li>
                <li className="flex gap-2 items-start">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  Priorità assoluta al supporto
                </li>
              </ul>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleSelect('premium_yearly')}>
                Scegli Annuale — Miglior Offerta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Confronto Funzionalità</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Funzionalità</th>
                    <th className="text-center py-2 px-4 font-medium">Free</th>
                    <th className="text-center py-2 px-4 font-medium text-primary">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map(f => (
                    <tr key={f.name} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">{f.name}</td>
                      <td className="text-center py-2.5 px-4 text-muted-foreground">
                        {renderFeatureValue(f.free)}
                      </td>
                      <td className="text-center py-2.5 px-4 font-medium text-primary">
                        {renderFeatureValue(f.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Puoi annullare in qualsiasi momento. Nessun addebito durante i 14 giorni di prova.
          </p>
        </div>
      </div>
    </div>
  );
}
