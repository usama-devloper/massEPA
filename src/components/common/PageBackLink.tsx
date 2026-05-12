import { ArrowLeft } from 'lucide-react';

interface PageBackLinkProps {
  label: string;
  onClick: () => void;
}

/** Back navigation row — spaced below the fixed TopBar via `.app-page-back`. */
export function PageBackLink({ label, onClick }: PageBackLinkProps) {
  return (
    <button type="button" onClick={onClick} className="app-page-back group">
      <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
      <span>{label}</span>
    </button>
  );
}
