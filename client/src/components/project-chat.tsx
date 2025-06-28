import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Clock, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatTimeAgo } from '@/lib/utils';

interface Message {
  id: number;
  projectId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: string;
  attachments?: any;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: number;
    firstName?: string;
    lastName?: string;
    username: string;
  };
}

interface ProjectChatProps {
  projectId: number;
  receiverId: number;
  receiverName: string;
}

export default function ProjectChat({ projectId, receiverId, receiverName }: ProjectChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate and join project
      websocket.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        projectId
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'authenticated':
          websocket.send(JSON.stringify({
            type: 'join_project',
            projectId
          }));
          break;
          
        case 'new_message':
          setMessages(prev => [...prev, data.message]);
          break;
          
        case 'user_typing':
          if (data.isTyping) {
            setTypingUsers(prev => new Set(prev).add(data.userId));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
          break;
          
        case 'message_read':
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, isRead: true } : msg
          ));
          break;
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user, projectId]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages/project/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [projectId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ws || !user) return;

    const messageData = {
      type: 'send_message',
      projectId,
      senderId: user.id,
      receiverId,
      content: newMessage.trim(),
      messageType: 'text'
    };

    ws.send(JSON.stringify(messageData));
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      ws.send(JSON.stringify({
        type: 'typing',
        userId: user.id,
        projectId,
        isTyping: false
      }));
    }
  };

  const handleTyping = () => {
    if (!ws || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      ws.send(JSON.stringify({
        type: 'typing',
        userId: user.id,
        projectId,
        isTyping: true
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      ws.send(JSON.stringify({
        type: 'typing',
        userId: user.id,
        projectId,
        isTyping: false
      }));
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const markAsRead = (messageId: number) => {
    if (!ws || !user) return;

    ws.send(JSON.stringify({
      type: 'mark_read',
      messageId,
      userId: user.id,
      projectId
    }));
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Chat with {receiverName}
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <Badge variant="outline" className="text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                Disconnected
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  onMouseEnter={() => !message.isRead && !isOwnMessage && markAsRead(message.id)}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-end space-x-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {message.sender?.firstName?.[0] || message.sender?.username[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div
                        className={`rounded-lg px-3 py-2 max-w-full ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        
                        <div className={`flex items-center mt-1 text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(message.createdAt)}
                          
                          {isOwnMessage && (
                            <div className="ml-2">
                              {message.isRead ? (
                                <CheckCheck className="w-3 h-3 text-blue-200" />
                              ) : (
                                <Check className="w-3 h-3 text-blue-300" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}