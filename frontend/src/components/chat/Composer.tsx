import React, { useState, useRef, useEffect, Suspense } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { getSocket } from '../../api/socket';
import { Send, Smile, X, Paperclip, Loader2, FileIcon } from 'lucide-react';
import Tooltip from '../Tooltip';
import { useMessageStore } from '../../store/useMessageStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useDropzone } from 'react-dropzone';
import { fileApi } from '../../api/file';
import type { UploadedFile } from '../../store/useFileStore';
import { toast } from 'sonner';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Lazy load EmojiPicker
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));

interface ComposerProps {
  channelId: string;
  threadParentId?: string;
}

export default function Composer({ channelId, threadParentId }: ComposerProps) {
  const { drafts, setDraft, replyingTo, setReplyingTo } = useMessageStore();
  const workspaceMembers = useWorkspaceStore(state => state.members) || [];
  
  const [content, setContent] = useState(drafts[channelId] || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const activeReply = replyingTo[channelId];

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (mentionsRef.current && !mentionsRef.current.contains(event.target as Node)) {
        setShowMentions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load draft when channel changes
  useEffect(() => {
    setContent(drafts[channelId] || '');
  }, [channelId, drafts]);

  // Auto-grow
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [content]);

  // Save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      setDraft(channelId, content);
    }, 500);
    return () => clearTimeout(timer);
  }, [content, channelId, setDraft]);

  const handleEmojiSelect = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const res = await fileApi.uploadFiles(acceptedFiles, undefined, channelId, (evt) => {
        setUploadProgress(Math.round((evt.loaded * 100) / (evt.total || 1)));
      });
      setAttachments(prev => [...prev, ...res.data]);
    } catch (error: any) {
      console.error('Upload failed', error);
      toast.error(error.response?.data?.message || 'Failed to attach file. Ensure Cloudinary is configured.');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop, 
    noClick: true, 
    noKeyboard: true 
  });

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return;
    if (isUploading) return;
    
    const socket = getSocket();
    if (socket) {
      socket.emit('message:send', { 
        channelId, 
        content: content.trim(),
        replyToId: threadParentId || activeReply?.id || null,
        attachmentIds: attachments.map(a => a.id)
      });
      socket.emit('typing:stop', { channelId });
    }
    
    setContent('');
    setAttachments([]);
    setDraft(channelId, '');
    if (activeReply) {
      setReplyingTo(channelId, null);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    
    // Typing indicator
    const socket = getSocket();
    if (socket) {
      if (val.length > 0) {
        socket.emit('typing:start', { channelId });
      } else {
        socket.emit('typing:stop', { channelId });
      }
    }

    // Mention logic
    const lastWord = val.split(' ').pop();
    if (lastWord?.startsWith('@')) {
      setMentionQuery(lastWord.substring(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const words = content.split(' ');
    words.pop();
    const newContent = [...words, `@${username} `].join(' ');
    setContent(newContent);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  return (
    <div {...getRootProps()} className={`relative bg-white border ${isDragActive ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-300'} rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all`}>
      <input {...getInputProps()} />
      {/* Mention Popup */}
      {showMentions && (
        <div ref={mentionsRef} className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
          {workspaceMembers
            .filter(m => m.user?.username?.toLowerCase().includes(mentionQuery.toLowerCase()) || m.user?.name?.toLowerCase().includes(mentionQuery.toLowerCase()))
            .map(member => (
              <button
                key={member.userId}
                onClick={() => insertMention(member.user.username)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center space-x-2 font-medium"
              >
                {member.user.avatar ? (
                  <img src={member.user.avatar} className="w-6 h-6 rounded-md object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs uppercase">
                    {member.user.username?.substring(0, 2)}
                  </div>
                )}
                <span>{member.user.username}</span>
                <span className="text-gray-400 text-xs font-normal">({member.user.name})</span>
              </button>
            ))}
            {workspaceMembers.filter(m => m.user?.username?.toLowerCase().includes(mentionQuery.toLowerCase()) || m.user?.name?.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No members found</div>
            )}
        </div>
      )}

      {/* Reply Preview */}
      {activeReply && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-primary">Replying to {activeReply.sender.username}</span>
            <span className="text-sm text-gray-500 truncate">{activeReply.content}</span>
          </div>
          <button 
            onClick={() => setReplyingTo(channelId, null)}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {attachments.map((file) => (
            <div key={file.id} className="relative group bg-gray-50 border border-gray-200 rounded-lg p-2 pr-8 flex items-center gap-3 w-64 max-w-full shadow-sm">
              <div className="shrink-0 w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') ? (
                  <img src={file.thumbnailUrl || file.secureUrl} className="w-full h-full object-cover" />
                ) : file.mimeType === 'application/pdf' ? (
                  <div className="text-red-500 font-bold text-xs">PDF</div>
                ) : (
                  <FileIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-700 truncate font-medium">{file.filename}</span>
                <span className="text-[10px] text-gray-500">{formatBytes(file.size)}</span>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeAttachment(file.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 shadow-sm transition-all z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="px-3 pt-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <span className="text-xs text-gray-500">{uploadProgress}%</span>
        </div>
      )}

      {/* Editor Toolbar (Hidden until Phase 3) */}
      
      <div className="flex items-end px-1 pb-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message #channel..."
          className="flex-1 max-h-44 min-h-[44px] bg-transparent resize-none outline-none py-3 px-3 text-gray-900 text-[15px] leading-relaxed custom-scrollbar font-sans w-full"
          rows={1}
          aria-label="Message composer"
        />
        
        <div className="flex items-center space-x-1 p-1 shrink-0">
          <span className={`text-[10px] font-medium px-2 ${content.length > 3900 ? 'text-red-500' : 'text-gray-400'}`}>
            {content.length > 0 ? `${content.length} / 4000` : ''}
          </span>
          
          <Tooltip content="Attach file" position="top">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                open();
              }}
              className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100 focus:outline-none"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="relative" ref={emojiPickerRef}>
            <Tooltip content="Emoji picker" position="top">
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle emoji picker"
              >
                <Smile className="w-5 h-5" />
              </button>
            </Tooltip>
            
            {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-3 z-50 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <Suspense fallback={<div className="w-[350px] h-[400px] bg-white flex items-center justify-center text-sm font-medium text-gray-400 border border-gray-100 rounded-xl shadow-xl">Loading emojis...</div>}>
                    <EmojiPicker 
                      onEmojiClick={handleEmojiSelect} 
                      autoFocusSearch={false}
                      lazyLoadEmojis={true}
                    />
                  </Suspense>
                </div>
            )}
          </div>
          
          <Tooltip content="Send message" position="top">
            <button
              onClick={handleSend}
              disabled={(!content.trim() && attachments.length === 0) || isUploading}
              className="w-11 h-11 flex items-center justify-center text-white bg-primary rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-primary-dark transition-all duration-200 shadow-sm active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
