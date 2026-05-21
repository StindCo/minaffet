import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

const BG_IMAGES = [ '/IMG_3851.jpeg'];
const bgImage = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);
    try {
      await login(email, motDePasse);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErreur(axiosErr.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche ───────────────────────────────────── */}
      <div className="w-full lg:w-[460px] flex flex-col bg-white shadow-xl z-10">

        {/* Bande tricolore épaisse */}
        <div className="h-1.5 flex shrink-0">
          <div className="flex-[3] bg-rdc-blue" />
          <div className="flex-[1] bg-rdc-yellow" />
          <div className="flex-[1] bg-rdc-red" />
        </div>

        <div className="flex-1 flex flex-col px-10 py-10 justify-between">

          {/* En-tête */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo.webp" alt="MINAFFET" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-slate-900 font-extrabold text-base leading-tight tracking-tight">
                  MINAFFET
                </p>
                <p className="text-slate-500 text-[9px] leading-tight">
                  Ministère des Affaires Étrangères, Coopération Internationale,<br />Francophonie et Diaspora Congolaise
                </p>
              </div>
            </div>

            <h1 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
              Connexion à la plateforme
            </h1>
            <p className="text-slate-500 text-sm">
              Suivi opérationnel du personnel et des missions diplomatiques.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@minaffet.cd"
                required
                autoFocus
                className={cn(
                  'w-full px-3.5 py-2.5 text-sm rounded-lg border text-slate-900 bg-white',
                  'placeholder-slate-400 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue',
                  erreur ? 'border-rdc-red bg-rdc-red/5' : 'border-slate-300 hover:border-slate-400'
                )}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={afficherMdp ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={cn(
                    'w-full px-3.5 py-2.5 pr-11 text-sm rounded-lg border text-slate-900 bg-white',
                    'placeholder-slate-400 transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue',
                    erreur ? 'border-rdc-red bg-rdc-red/5' : 'border-slate-300 hover:border-slate-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setAfficherMdp(!afficherMdp)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {afficherMdp ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {erreur && (
              <div className="flex items-center gap-2.5 bg-rdc-red/5 border border-rdc-red/30 text-rdc-red text-sm px-4 py-2.5 rounded-lg">
                <AlertCircle size={15} className="shrink-0" />
                {erreur}
              </div>
            )}

            {/* Bouton — toujours bleu, opacity si loading */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                'bg-rdc-blue text-white shadow-sm shadow-rdc-blue/30',
                loading
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-rdc-blue-dark active:scale-[0.99]'
              )}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-100">
            {/* Drapeau RDC miniature */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-3 w-8 rounded-sm overflow-hidden border border-slate-200 shrink-0">
                <div className="flex-[3] bg-rdc-blue" />
                <div className="flex-[1] bg-rdc-yellow" />
                <div className="flex-[1] bg-rdc-red" />
              </div>
              <p className="text-xs text-slate-400">
                Accès restreint · République Démocratique du Congo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : image ────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={bgImage}
          alt="MINAFFET"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-slate-900/10" />

        {/* Bande tricolore — bord gauche */}
        <div className="absolute left-0 inset-y-0 w-1 flex flex-col">
          <div className="flex-[3] bg-rdc-blue" />
          <div className="flex-[1] bg-rdc-yellow" />
          <div className="flex-[1] bg-rdc-red" />
        </div>

        {/* Texte bas */}
        <div className="absolute bottom-0 inset-x-0 px-10 pb-10">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
            République Démocratique du Congo
          </p>
          <h2 className="text-white text-2xl font-bold leading-snug drop-shadow-lg">
            Plateforme de Suivi<br />
            Opérationnel du Personnel<br />
            et des Missions
          </h2>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-[2px] bg-rdc-yellow rounded" />
              <p className="text-white/60 text-sm">Ministère des Affaires Étrangères, Coopération Internationale, Francophonie et Diaspora Congolaise</p>
            </div>
        </div>
      </div>

    </div>
  );
}
