import { useAppStore } from '@/store/useAppStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

export function VoiceSetupModal() {
  const isOpen = useAppStore((s) => s.isVoiceSetupOpen);
  const setOpen = useAppStore((s) => s.setVoiceSetupOpen);
  const eqBass = useAppStore((s) => s.eqBass);
  const setEqBass = useAppStore((s) => s.setEqBass);
  const eqMid = useAppStore((s) => s.eqMid);
  const setEqMid = useAppStore((s) => s.setEqMid);
  const eqTreble = useAppStore((s) => s.eqTreble);
  const setEqTreble = useAppStore((s) => s.setEqTreble);
  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);
  const speechRate = useAppStore((s) => s.speechRate);
  const setSpeechRate = useAppStore((s) => s.setSpeechRate);
  const speechPitch = useAppStore((s) => s.speechPitch);
  const setSpeechPitch = useAppStore((s) => s.setSpeechPitch);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl border-border bg-card max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-bold">🎙️ Setup Voce</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">🔊 Volume</label>
              <span className="text-sm text-muted-foreground">{volume}%</span>
            </div>
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} />
          </div>

          {/* Speed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">⚡ Velocità</label>
              <span className="text-sm text-muted-foreground">{speechRate.toFixed(2)}×</span>
            </div>
            <Slider value={[speechRate]} onValueChange={(v) => setSpeechRate(v[0])} min={0.5} max={1.5} step={0.01} />
          </div>

          {/* Pitch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">🎵 Tono</label>
              <span className="text-sm text-muted-foreground">{speechPitch.toFixed(2)}</span>
            </div>
            <Slider value={[speechPitch]} onValueChange={(v) => setSpeechPitch(v[0])} min={0.5} max={1.5} step={0.01} />
          </div>

          {/* EQ Section */}
          <div className="border-t border-border pt-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">🎛️ Equalizzatore Voce</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Bassi</label>
                <span className="text-sm text-muted-foreground">{eqBass > 0 ? '+' : ''}{eqBass} dB</span>
              </div>
              <Slider value={[eqBass]} onValueChange={(v) => setEqBass(v[0])} min={-12} max={12} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Medi</label>
                <span className="text-sm text-muted-foreground">{eqMid > 0 ? '+' : ''}{eqMid} dB</span>
              </div>
              <Slider value={[eqMid]} onValueChange={(v) => setEqMid(v[0])} min={-12} max={12} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Alti</label>
                <span className="text-sm text-muted-foreground">{eqTreble > 0 ? '+' : ''}{eqTreble} dB</span>
              </div>
              <Slider value={[eqTreble]} onValueChange={(v) => setEqTreble(v[0])} min={-12} max={12} step={1} />
            </div>

            <button
              onClick={() => { setEqBass(0); setEqMid(0); setEqTreble(0); }}
              className="w-full h-10 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Reset Equalizzatore
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
