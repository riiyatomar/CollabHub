import React, { useState } from 'react';
import type { Message } from '../../store/useMessageStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getSocket } from '../../api/socket';
import { cn } from '../../utils/cn';
import { Reply, MoreHorizontal, Edit2, Trash2, Pin, Copy, CornerRightUp, AlertTriangle, CheckCheck, Check, FileIcon, Download, Bookmark, MessageSquareText, CheckSquare } from 'lucide-react';
import Tooltip from '../Tooltip';
import { useModalStore } from '../../store/useModalStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import LinkPreview from './LinkPreview';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
  isThreadParent?: boolean;
  isThreadReply?: boolean;
}

const MessageItem = React.memo(({ message, showAvatar, isThreadParent, isThreadReply }: MessageItemProps) => {
  const { user } = useAuthStore();
  const { setReplyingTo, setActiveThread } = useMessageStore();
  const { createBookmark } = useBookmarkStore();
  const { onOpen } = useModalStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  const isOwner = user?.id === message.sender.id;
  const isDeleted = message.isDeleted;
  const isEdited = message.isEdited;

  const date = new Date(message.createdAt);
  const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // grouped reactions
  const reactionGroups = (message.reactions || []).reduce((acc, curr) => {
    if (!acc[curr.emoji]) acc[curr.emoji] = [];
    acc[curr.emoji].push(curr.userId);
    return acc;
  }, {} as Record<string, string[]>);

  const handleEdit = () => {
    if (!editContent.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('message:edit', { messageId: message.id, channelId: message.channelId, content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      const socket = getSocket();
      if (socket) {
        socket.emit('message:delete', { messageId: message.id, channelId: message.channelId });
      }
    }
  };

  const handlePin = () => {
    const socket = getSocket();
    if (socket) {
      if (message.pinnedBy) {
        socket.emit('message:unpin', { messageId: message.id, channelId: message.channelId });
      } else {
        socket.emit('message:pin', { messageId: message.id, channelId: message.channelId });
      }
    }
    setShowMenu(false);
  };

  const handleReact = (emoji: string) => {
    const socket = getSocket();
    if (socket && user) {
      const hasReacted = reactionGroups[emoji]?.includes(user.id);
      if (hasReacted) {
        socket.emit('reaction:remove', { messageId: message.id, channelId: message.channelId, emoji });
      } else {
        socket.emit('reaction:add', { messageId: message.id, channelId: message.channelId, emoji });
      }
    }
    setShowMenu(false);
  };

  // Status indicators for own messages
  const renderStatus = () => {
    if (!isOwner) return null;
    
    // By default, if socket emitted message:new but no read states yet, it's 'sent'
    // This assumes backend read tracking actually happens. The prompt asks for receipts.
    // If message.status === 'read' show CheckCheck, if 'delivered' show CheckCheck (gray), etc.
    let Icon = Check;
    let color = 'text-gray-400';
    let label = 'Sent';

    if (message.status === 'read') {
      Icon = CheckCheck;
      color = 'text-primary';
      label = 'Read';
    } else if (message.status === 'delivered') {
      Icon = CheckCheck;
      label = 'Delivered';
    }

    return (
      <span className={`ml-2 ${color} mt-auto pb-0.5`}>
        <Tooltip content={label} position="top">
          <Icon className="w-3.5 h-3.5 inline" />
        </Tooltip>
      </span>
    );
  };

  // Basic URL regex to find first link
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.content.match(urlRegex);
  const firstUrl = urls && urls.length > 0 ? urls[0] : null;

  return (
    <div 
      className={cn(
        "group flex px-4 hover:bg-gray-50 transition-colors relative py-0.5", 
        showAvatar ? "mt-4" : "mt-0.5", 
        message.pinnedBy && "bg-amber-50/30",
        (isHovered || showMenu) && "z-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Floating Action Bar */}
      {!isDeleted && (isHovered || showMenu) && !isEditing && (
        <div className="absolute right-4 -top-3 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-nowrap shrink-0 items-center p-0.5 z-10 animate-in fade-in zoom-in-95 duration-100">
          <button onClick={() => handleReact('👍')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Thumbs Up">👍</button>
          <button onClick={() => handleReact('❤️')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Heart">❤️</button>
          
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          
          <button onClick={() => setReplyingTo(message.channelId, message)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Reply">
            <Reply className="w-4 h-4" />
          </button>

          {!isThreadParent && !isThreadReply && (
            <button onClick={() => setActiveThread(message)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Reply in thread">
              <MessageSquareText className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="More actions">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full w-48 bg-white border border-gray-200 shadow-xl rounded-xl py-1 z-50">
                {!isThreadParent && !isThreadReply && (
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => { setActiveThread(message); setShowMenu(false); }}>
                    <MessageSquareText className="w-4 h-4 mr-2 text-gray-400" /> Reply in thread
                  </button>
                )}
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => { setReplyingTo(message.channelId, message); setShowMenu(false); }}>
                  <Reply className="w-4 h-4 mr-2 text-gray-400" /> Reply inline
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => handlePin()}>
                  <Pin className="w-4 h-4 mr-2 text-gray-400" /> {message.pinnedBy ? 'Unpin message' : 'Pin message'}
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" 
                  onClick={() => {
                    createBookmark({ messageId: message.id, channelId: message.channelId });
                    setShowMenu(false);
                  }}
                >
                  <Bookmark className="w-4 h-4 mr-2 text-gray-400" /> Bookmark
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                  onClick={() => {
                    onOpen('createTask', { messageId: message.id, initialTitle: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '') });
                    setShowMenu(false);
                  }}
                >
                  <CheckSquare className="w-4 h-4 mr-2 text-gray-400" /> Create Task
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center">
                  <Copy className="w-4 h-4 mr-2 text-gray-400" /> Copy Link
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center">
                  <CornerRightUp className="w-4 h-4 mr-2 text-gray-400" /> Forward
                </button>
                
                {isOwner && (
                  <>
                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                      <Edit2 className="w-4 h-4 mr-2 text-gray-400" /> Edit Message
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2 text-red-400" /> Delete Message
                    </button>
                  </>
                )}
                
                {!isOwner && (
                  <>
                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-400" /> Report Message
                    </button>
                  </>
                )}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="w-10 shrink-0 mr-3 flex flex-col items-center pt-1">
        {showAvatar ? (
          message.sender.avatar ? (
            <img src={message.sender.avatar} alt={message.sender.username} className="w-10 h-10 rounded-[14px] object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-100 to-indigo-50 text-primary flex items-center justify-center font-bold uppercase text-sm border border-indigo-100">
              {message.sender.username.substring(0, 2)}
            </div>
          )
        ) : (
          <div className="w-10 text-[10px] text-gray-400 text-center opacity-0 group-hover:opacity-100 select-none pt-1">
            {timeString}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pb-1">
        {showAvatar && (
          <div className="flex items-baseline mb-0.5 space-x-2">
            <span className="font-bold text-gray-900 hover:underline cursor-pointer">{message.sender.username}</span>
            <span className="text-xs text-gray-500 font-medium">{timeString}</span>
          </div>
        )}
        
        {message.replyTo && (
          <div className="text-sm text-gray-500 border-l-2 border-gray-300 pl-2 mb-1.5 truncate flex items-center bg-gray-50 rounded-r py-0.5 px-2 w-fit max-w-full cursor-pointer hover:bg-gray-100 transition-colors">
            <Reply className="w-3 h-3 mr-1.5" />
            <span className="font-medium mr-1.5">{message.replyTo.sender.username}:</span> 
            <span className="truncate">{message.replyTo.content}</span>
          </div>
        )}
        
        {message.pinnedBy && (
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wide flex items-center mb-1">
            <Pin className="w-3 h-3 mr-1" /> Pinned
          </div>
        )}

        {isDeleted ? (
          <div className="text-gray-400 italic text-[15px] flex items-center">
            <Trash2 className="w-4 h-4 mr-1.5 opacity-50" />
            This message was deleted.
          </div>
        ) : isEditing ? (
          <div className="mt-1">
            <textarea 
              value={editContent} 
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-white border border-primary rounded-lg p-2 text-[15px] focus:outline-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-1">
              <button onClick={() => { setIsEditing(false); setEditContent(message.content); }} className="text-xs font-medium px-2 py-1 hover:bg-gray-100 rounded text-gray-500">Cancel</button>
              <button onClick={handleEdit} className="text-xs font-medium px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark">Save</button>
            </div>
          </div>
        ) : (
          <div className="text-gray-800 text-[15px] leading-relaxed break-words flex flex-col gap-x-2">
            <div className="prose prose-sm max-w-none prose-p:leading-snug prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-pre:p-2 prose-pre:rounded-md prose-pre:overflow-x-auto prose-code:text-primary prose-a:text-blue-600 hover:prose-a:underline marker:text-gray-400 w-full break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            </div>
            {/* Thread Replies / Reactions */}
            {!isDeleted && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {isEdited && <span className="text-[11px] text-gray-400 font-medium select-none mr-2">(edited)</span>}
                {renderStatus()}
              </div>
            )}
            {firstUrl && <LinkPreview url={firstUrl} />}
          </div>
        )}
        {/* Attachments */}
        {!isDeleted && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map(file => (
              <div 
                key={file.id} 
                onClick={() => {
                  const url = file.mimeType === 'application/pdf' && !file.secureUrl.endsWith('.pdf') 
                    ? `${file.secureUrl}.pdf` 
                    : file.secureUrl;
                  window.open(url, '_blank');
                }}
                className="relative group border border-gray-200 rounded-xl overflow-hidden bg-white max-w-sm w-full sm:w-64 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {file.mimeType.startsWith('video/') ? (
                  <div className="h-40 bg-black flex items-center justify-center overflow-hidden">
                    <video src={file.secureUrl} controls className="w-full h-full object-contain" />
                  </div>
                ) : file.mimeType === 'application/pdf' ? (
                  <div className="h-24 bg-red-50 flex items-center justify-center border-b border-red-100">
                    <FileIcon className="w-10 h-10 text-red-500" />
                    <span className="ml-2 font-bold text-red-600">PDF</span>
                  </div>
                ) : file.mimeType.startsWith('image/') ? (
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img src={file.secureUrl} alt={file.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-24 bg-gray-50 flex items-center justify-center">
                    <FileIcon className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>{file.filename}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 uppercase">{file.extension}</span>
                    <a 
                      href={file.mimeType === 'application/pdf' && !file.secureUrl.endsWith('.pdf') ? `${file.secureUrl}.pdf` : file.secureUrl} 
                      download 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={(e) => e.stopPropagation()} 
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reactions */}
        {!isDeleted && Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(reactionGroups).map(([emoji, users]) => {
              const hasReacted = user && users.includes(user.id);
              return (
                <button 
                  key={emoji} 
                  onClick={() => handleReact(emoji)}
                  className={cn(
                    "flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    hasReacted ? "bg-primary/10 border-primary/20 text-primary" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread Replies summary */}
        {!isThreadParent && !isThreadReply && message._count?.replies ? (
          <div className="mt-1.5 flex items-center">
            <button 
              onClick={() => setActiveThread(message)}
              className="flex items-center space-x-1.5 text-primary hover:bg-primary/5 px-2 py-1 rounded-md transition-colors"
            >
              {message.replyTo ? (
                <div className="flex -space-x-1.5 mr-1">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-white"></div>
                  <div className="w-5 h-5 rounded-full bg-primary/40 border border-white"></div>
                </div>
              ) : null}
              <span className="text-xs font-bold">{message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default MessageItem;
