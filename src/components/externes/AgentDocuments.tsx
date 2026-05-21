import { useState, useRef } from 'react';
import { Upload, Trash2, Download, FileText, Plus, X } from 'lucide-react';
import {
  useAgentDocuments, useUploadDocument, useDeleteDocument,
  TYPE_DOC_LABELS, TYPE_DOC_ICONS, formatFileSize, getDocUrl,
  type AgentDocument,
} from '../../hooks/useAgentDocuments';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const ALL_TYPES = Object.keys(TYPE_DOC_LABELS) as AgentDocument['type'][];

interface Props { agentId: string }

export function AgentDocuments({ agentId }: Props) {
  const { canWrite, isAdmin } = useAuthStore();
  const { data, isLoading } = useAgentDocuments(agentId);
  const documents = data?.data ?? [];

  const uploadMutation = useUploadDocument(agentId);
  const deleteMutation = useDeleteDocument(agentId);

  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState<AgentDocument['type']>('ORDRE_MUTATION');
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !nom) setNom(f.name.replace(/\.[^/.]+$/, ''));
  }

  async function handleUpload() {
    if (!file) { setUploadError('Veuillez sélectionner un fichier'); return; }
    if (!nom.trim()) { setUploadError('Veuillez saisir un nom'); return; }
    setUploadError('');
    try {
      await uploadMutation.mutateAsync({ fichier: file, nom: nom.trim(), type });
      setShowForm(false);
      setNom('');
      setFile(null);
      setType('ORDRE_MUTATION');
    } catch {
      setUploadError('Erreur lors de l\'upload');
    }
  }

  async function handleDelete(doc: AgentDocument) {
    if (!window.confirm(`Supprimer "${doc.nom}" ?`)) return;
    await deleteMutation.mutateAsync(doc.id);
  }

  function typeColor(t: AgentDocument['type']) {
    const map: Record<AgentDocument['type'], string> = {
      ORDRE_MUTATION: 'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/20',
      PASSEPORT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ACTE_NOMINATION: 'bg-violet-50 text-violet-700 border-violet-200',
      RAPPORT: 'bg-amber-50 text-amber-700 border-amber-200',
      AUTRE: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    return map[t];
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-slate-400" />
          <span className="font-semibold text-slate-700 text-sm">Documents</span>
          {documents.length > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
              {documents.length}
            </span>
          )}
        </div>
        {canWrite() && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              showForm
                ? 'bg-rdc-red/10 text-rdc-red hover:bg-rdc-red/20'
                : 'bg-rdc-blue/10 text-rdc-blue hover:bg-rdc-blue/20'
            )}
          >
            {showForm ? <><X size={12} /> Annuler</> : <><Plus size={12} /> Ajouter</>}
          </button>
        )}
      </div>

      {/* Formulaire upload */}
      {showForm && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
          {/* Type */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all text-center',
                  type === t
                    ? 'bg-rdc-blue text-white border-rdc-blue'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-rdc-blue/40'
                )}
              >
                {TYPE_DOC_ICONS[t]} {TYPE_DOC_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Nom */}
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du document"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rdc-blue/30"
          />

          {/* Fichier */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2.5 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-rdc-blue/40 transition-colors bg-white"
          >
            <Upload size={15} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-400 truncate">
              {file ? file.name : 'Sélectionner un fichier (PDF, Word, image)'}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploadError && (
            <p className="text-xs text-rdc-red">{uploadError}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !file}
            className="flex items-center gap-1.5 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <><div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> Upload…</>
            ) : (
              <><Upload size={13} /> Uploader</>
            )}
          </button>
        </div>
      )}

      {/* Liste documents */}
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-300 text-sm">
            <div className="animate-spin w-4 h-4 border border-slate-300 border-t-rdc-blue rounded-full mr-2" />
            Chargement…
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-3xl mb-2">📂</p>
            <p className="text-slate-300 text-sm">Aucun document</p>
            {canWrite() && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-rdc-blue text-xs hover:underline"
              >
                Ajouter un premier document
              </button>
            )}
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
              <span className="text-xl shrink-0">{TYPE_DOC_ICONS[doc.type]}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{doc.nom}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', typeColor(doc.type))}>
                    {TYPE_DOC_LABELS[doc.type]}
                  </span>
                  {doc.taille && (
                    <span className="text-[10px] text-slate-400">{formatFileSize(doc.taille)}</span>
                  )}
                  {doc.uploadedBy && (
                    <span className="text-[10px] text-slate-300">
                      par {doc.uploadedBy.prenom} {doc.uploadedBy.nom}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a
                  href={getDocUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-rdc-blue hover:bg-rdc-blue/10 rounded-lg transition-colors"
                  title="Télécharger"
                >
                  <Download size={13} />
                </a>
                {isAdmin() && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-1.5 text-slate-400 hover:text-rdc-red hover:bg-rdc-red/10 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
