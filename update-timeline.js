const fs = require('fs');
let content = fs.readFileSync('src/components/Timeline.tsx', 'utf8');

// Update TimelineProps
content = content.replace(
  'interface TimelineProps {
  items: TimelineItemType[]
  noteReferenceCount?: Map<string, number>
}',
  'interface TimelineProps {
  items: TimelineItemType[]
  noteReferenceCount?: Map<string, number>
  notes?: IncidentNote[]
  onReferenceClick?: (noteId: string) => void
}'
);

fs.writeFileSync('src/components/Timeline.tsx', content);
console.log('Done');

