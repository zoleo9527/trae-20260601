import { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { roleColors } from '../utils/format';
import { MessageSquare, Send } from 'lucide-react';
import type { Note } from '../types/order';

interface TimelineProps {
  notes: Note[];
  orderId: string;
}

export const Timeline = ({ notes, orderId }: TimelineProps) => {
  const [newNote, setNewNote] = useState('');
  const { currentRole, currentUser, addNote } = useOrderStore();

  const handleSubmit = () => {
    if (!newNote.trim()) return;
    addNote(orderId, newNote.trim());
    setNewNote('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          历史备注
          <span className="text-sm text-slate-400 font-normal">({notes.length}条)</span>
        </h3>
      </div>

      <div className="p-5">
        <div className="relative pl-6 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">暂无备注</div>
          ) : (
            notes.map((note, index) => (
              <div key={note.id} className="relative">
                {index < notes.length - 1 && (
                  <div className="absolute left-0 top-4 w-px h-full bg-slate-200 -translate-x-1/2"></div>
                )}
                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 -translate-x-1/2 border-2 border-white"></div>

                <div className="ml-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border font-medium ${roleColors[note.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                      {note.role}
                    </span>
                    <span className="text-sm text-slate-700 font-medium">{note.author}</span>
                    <span className="text-xs text-slate-400">{note.createdAt}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 添加备注 */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <div
              className={`text-xs px-2 py-1 rounded border font-medium whitespace-nowrap ${roleColors[currentRole] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
            >
              {currentRole}
            </div>
            <div className="flex-1">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`以 ${currentUser} 的身份添加备注... (Ctrl+Enter 发送)`}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!newNote.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  添加备注
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
