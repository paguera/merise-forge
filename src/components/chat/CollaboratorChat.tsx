import { useState, useRef, useEffect, KeyboardEvent, Fragment } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Smile, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRealtimeChat, ChatMessage, ChatReaction } from '@/hooks/useRealtimeChat';
import { cn } from '@/lib/utils';
import { getMuted, setMuted } from '@/lib/notificationSound';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface Props {
  projectId: string | null;
  username: string;
  userColor: string;
  connected: boolean;
}

export function CollaboratorChat({ projectId, username, userColor, connected }: Props) {
  // All hooks MUST be called unconditionally at the top, before any conditional returns
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSoundMuted, setIsSoundMuted] = useState(() => getMuted());
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);
  
  // Hook must be called unconditionally - pass null projectId when not connected
  const { messages, loading, sendMessage, toggleReaction, getReactionsForMessage } = useRealtimeChat(
    connected ? projectId : null, 
    username, 
    userColor
  );

  const handleToggleMute = () => {
    const newMuted = !isSoundMuted;
    setIsSoundMuted(newMuted);
    setMuted(newMuted);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > prevMessagesLength.current) {
      setUnreadCount((prev) => prev + (messages.length - prevMessagesLength.current));
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, isOpen]);

  // Clear unread count when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "rounded-full w-14 h-14 shadow-lg relative",
            !connected && "opacity-80"
          )}
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {connected && unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs bg-destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      ) : !connected ? (
        <div className="bg-card border border-border rounded-lg shadow-xl w-80 sm:w-96 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Chat collaboratif</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Rejoignez un projet</h3>
              <p className="text-sm text-muted-foreground">
                Pour utiliser le chat collaboratif, rejoignez d'abord un projet partagé via le bouton "Collaboration" dans l'en-tête.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={cn(
            "bg-card border border-border rounded-lg shadow-xl transition-all duration-200 overflow-hidden",
            isMinimized ? "w-72" : "w-80 sm:w-96"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Chat collaboratif</span>
              <Badge variant="secondary" className="text-xs">
                {messages.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleToggleMute}
                title={isSoundMuted ? "Activer les sons" : "Couper les sons"}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="h-80" ref={scrollRef}>
                <div className="p-3 space-y-3">
                  {loading && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Chargement...
                    </div>
                  )}
                  
                  {!loading && messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Aucun message. Démarrez la conversation !
                    </div>
                  )}

                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.username === username}
                      formatTime={formatTime}
                      reactions={getReactionsForMessage(msg.id)}
                      onToggleReaction={(emoji) => toggleReaction(msg.id, emoji)}
                      currentUsername={username}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Votre message..."
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  formatTime: (dateStr: string) => string;
  reactions: ChatReaction[];
  onToggleReaction: (emoji: string) => void;
  currentUsername: string;
}

function MessageBubble({ message, isOwn, formatTime, reactions, onToggleReaction, currentUsername }: MessageBubbleProps) {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [], hasCurrentUser: false };
    }
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.username);
    if (r.username === currentUsername) {
      acc[r.emoji].hasCurrentUser = true;
    }
    return acc;
  }, {} as Record<string, { count: number; users: string[]; hasCurrentUser: boolean }>);

  // Parse message to highlight mentions
  const renderMessageWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the mention with highlighting
      const mentionedUser = match[1];
      const isCurrentUser = mentionedUser.toLowerCase() === currentUsername.toLowerCase();
      parts.push(
        <span 
          key={match.index} 
          className={cn(
            "font-semibold px-0.5 rounded",
            isCurrentUser 
              ? "bg-accent/30 text-accent" 
              : "text-primary"
          )}
        >
          @{mentionedUser}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={cn("flex flex-col gap-1 group", isOwn ? "items-end" : "items-start")}>
      <div className="flex items-center gap-2">
        {!isOwn && (
          <span 
            className="text-xs font-medium"
            style={{ color: message.color }}
          >
            {message.username}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {formatTime(message.created_at)}
        </span>
      </div>
      
      <div className="relative max-w-[85%]">
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap",
            "min-w-0 w-full",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          )}
          style={{
            ...((!isOwn ? { borderLeft: `3px solid ${message.color}` } : {})),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {renderMessageWithMentions(message.message)}
        </div>

        {/* Reaction button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute -right-2 -top-2 h-6 w-6 rounded-full bg-card border border-border shadow-sm",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              <Smile className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-secondary"
                  onClick={() => onToggleReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Display reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <button
              key={emoji}
              onClick={() => onToggleReaction(emoji)}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
                "border transition-colors",
                data.hasCurrentUser
                  ? "bg-primary/20 border-primary/40"
                  : "bg-secondary/50 border-border hover:bg-secondary"
              )}
              title={data.users.join(', ')}
            >
              <span>{emoji}</span>
              <span className="text-muted-foreground">{data.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
