import { Card, EmptyState, SectionTitle } from '../components/ui';
import { EW } from '../assets/icons';

const ENTRIES = [
  { t: 'How we run the weekly management jour fixe', c: 'Process note', d: 'Agenda, action tracker review, decision log update.' },
  { t: 'Lessons learned – A320 recurrent 2026', c: 'Lessons learned', d: 'Scenario design, scheduling, courseware hand-over.' },
  { t: 'Where to find controlled manuals', c: 'Guidance', d: 'Controlled manuals stay in the approved document-management system; WINGS CONTROL links to them.' },
];

export function KnowledgePage() {
  return (
    <div>
      <SectionTitle title="Knowledge Base" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ENTRIES.map((e) => (
          <Card key={e.t} className="p-4"><span className="text-[11px] font-bold uppercase tracking-wide text-brand">{e.c}</span><h3 className="mt-1 font-bold text-ink">{e.t}</h3><p className="mt-1 text-sm text-ink-muted">{e.d}</p></Card>
        ))}
      </div>
      <Card className="mt-5"><EmptyState icon={EW.book} title="Editor and document uploads follow in a later phase" text="Rich-text entries, categories, tags and DOCX/PDF attachments with text extraction for search." /></Card>
    </div>
  );
}
