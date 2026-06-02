import { useState, useRef, useEffect } from 'react';
import { Send, Check, CheckCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import type { Message, Child } from '@/types';

interface MessageListProps {
  messages: Message[];
  child: Child;
  readOnly?: boolean;
  className?: string;
}

const quickReplies = [
  '已收到，谢谢关心！',
  '宝宝今天状态很好，请放心',
  '我稍后详细跟您说',
];

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export default function MessageList({
  messages,
  child,
  readOnly = false,
  className,
}: MessageListProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAppStore((state) => state.currentUser);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const markMessageAsRead = useAppStore((state) => state.markMessageAsRead);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (readOnly) return;
    messages.forEach((msg) => {
      if (msg.sender === 'parent' && !msg.isRead) {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, markMessageAsRead, readOnly]);

  const handleSend = (content: string = inputValue) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || !currentUser) return;

    sendMessage(child.id, trimmedContent, currentUser.name);
    setInputValue('');
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-cream-50 rounded-2xl overflow-hidden',
        readOnly ? 'h-[500px]' : 'h-full',
        className
      )}
    >
      {readOnly && (
        <div className="bg-info-50 px-4 py-3 border-b border-info-100 flex items-center gap-2">
          <Eye className="w-4 h-4 text-info-600" />
          <p className="text-sm text-info-700">园长查看模式 - 仅可浏览消息</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">暂无消息</p>
          </div>
        ) : (
          messages.map((message) => {
            const isTeacher = message.sender === 'teacher';

            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2 animate-fade-in-up',
                  isTeacher ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium',
                    isTeacher
                      ? 'bg-info-100 text-info-700'
                      : 'bg-primary-100 text-primary-700'
                  )}
                >
                  {message.senderName.charAt(0)}
                </div>

                <div
                  className={cn(
                    'flex flex-col max-w-[75%]',
                    isTeacher ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'px-4 py-2 rounded-2xl text-sm',
                      isTeacher
                        ? 'bg-info-500 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                    )}
                  >
                    {message.content}
                  </div>

                  {isTeacher && !readOnly && (
                    <div className="mt-1 flex items-center gap-1">
                      {message.isRead ? (
                        <CheckCheck className="w-3 h-3 text-info-500" />
                      ) : (
                        <Check className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 text-xs bg-cream-100 hover:bg-cream-200 text-gray-700 rounded-full transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`回复${child.parentName}...`}
              className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-info-300 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className={cn(
                'px-4 py-2.5 rounded-xl flex items-center justify-center transition-all',
                inputValue.trim()
                  ? 'bg-info-500 hover:bg-info-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
