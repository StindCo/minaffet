import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { DocumentType } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  missionId: string;
  onClose: () => void;
}

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'ORDRE_DE_MISSION', label: 'Ordre de Mission' },
  { value: 'RAPPORT_DE_MISSION', label: 'Rapport de Mission' },
  { value: 'COMPTE_RENDU', label: 'Compte-rendu' },
  { value: 'NOTE_VERBALE', label: 'Note Verbale' },
  { value: 'ACCORD', label: 'Accord / Protocole' },
  { value: 'AUTRE', label: 'Autre document' },
];

export function DocumentUploadModal({ missionId, onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<DocumentType>('ORDRE_DE_MISSION');
  const [titre, setTitre] = useState('');
  const [deposePar, setDeposePar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!titre) setTitre(f.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !titre) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('titre', titre);
    if (deposePar) formData.append('deposePar', deposePar);

    try {
      await api.post(`/documents/mission/${missionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['missions', missionId] });
      onClose();
    } catch {
      setError('Erreur lors du dépôt du document. Vérifiez le format (PDF ou Word uniquement).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Déposer un document</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Zone de dépôt */}
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            )}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={22} className="text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} Ko</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cliquez pour sélectionner un fichier</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word (.doc, .docx) · Max 10 Mo</p>
              </div>
            )}
          </div>

          {/* Type de document */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type de document *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Titre du document *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Rapport de mission - Bruxelles, mai 2026"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Déposé par */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Déposé par</label>
            <input
              type="text"
              value={deposePar}
              onChange={(e) => setDeposePar(e.target.value)}
              placeholder="Nom de l'agent"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!file || !titre || loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Dépôt en cours...' : 'Déposer le document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
