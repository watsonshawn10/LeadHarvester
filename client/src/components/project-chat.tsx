import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, MessageSquare, Clock, Check, CheckCheck, DollarSign, FileText, Calendar } from 'lucide-react';
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
  
  // Quote submission state
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

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
      if (!user) {
        console.log('No user authenticated, skipping message load');
        return;
      }

      try {
        console.log(`Loading messages for project ${projectId}, receiverId: ${receiverId}`);
        const response = await fetch(`/api/messages/project/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched messages:', data);
          
          // Filter messages based on receiverId for specific conversations
          // If receiverId is 0, show all messages for the project
          const filteredMessages = receiverId === 0 ? data : data.filter((msg: Message) => 
            (msg.senderId === user?.id && msg.receiverId === receiverId) ||
            (msg.senderId === receiverId && msg.receiverId === user?.id)
          );
          console.log('Filtered messages:', filteredMessages);
          setMessages(filteredMessages);
        } else {
          console.error('Failed to fetch messages:', response.status, response.statusText);
          if (response.status === 401) {
            console.error('Authentication required to view messages');
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [projectId, receiverId, user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ws || !user) return;

    // For general project chat (receiverId = 0), use a broadcast approach
    const messageData = {
      type: 'send_message',
      projectId,
      senderId: user.id,
      receiverId: receiverId === 0 ? null : receiverId, // null for general project messages
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

  const handleSubmitQuote = async () => {
    if (!quoteAmount || !quoteDescription || !user) return;
    
    setIsSubmittingQuote(true);
    
    try {
      // Create the quote in the database
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          serviceProviderId: user.id,
          amount: parseFloat(quoteAmount),
          description: quoteDescription,
          timeline: quoteTimeline || 'To be discussed'
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit quote');
      
      // Send quote notification message via WebSocket
      if (ws) {
        const quoteMessage = {
          type: 'send_message',
          projectId,
          senderId: user.id,
          receiverId,
          content: `💰 New Quote Submitted\n\nAmount: $${quoteAmount}\nDescription: ${quoteDescription}\nTimeline: ${quoteTimeline || 'To be discussed'}`,
          messageType: 'quote'
        };
        
        ws.send(JSON.stringify(quoteMessage));
      }
      
      // Reset form and close dialog
      setQuoteAmount('');
      setQuoteDescription('');
      setQuoteTimeline('');
      setShowQuoteDialog(false);
      
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setIsSubmittingQuote(false);
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

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Chat with {receiverName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Sign in required</h3>
            <p className="text-neutral-600">
              Please sign in to view and send messages.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                          message.messageType === 'quote'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-gray-900 border border-green-200'
                            : isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.messageType === 'quote' && (
                          <div className="flex items-center mb-2">
                            <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              Quote Submitted
                            </Badge>
                          </div>
                        )}
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
            
            {/* Show quote button only for service providers */}
            {user?.userType === 'service_provider' && (
              <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    <DollarSign className="w-4 h-4 mr-1" />
                    Quote
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Quote</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quote-amount">Quote Amount ($)</Label>
                      <Input
                        id="quote-amount"
                        type="number"
                        placeholder="1500"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quote-description">Work Description</Label>
                      <Textarea
                        id="quote-description"
                        placeholder="Describe the work to be done..."
                        value={quoteDescription}
                        onChange={(e) => setQuoteDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quote-timeline">Timeline</Label>
                      <Input
                        id="quote-timeline"
                        placeholder="2-3 weeks"
                        value={quoteTimeline}
                        onChange={(e) => setQuoteTimeline(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowQuoteDialog(false)}
                        disabled={isSubmittingQuote}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmitQuote}
                        disabled={!quoteAmount || !quoteDescription || isSubmittingQuote}
                      >
                        {isSubmittingQuote ? 'Submitting...' : 'Submit Quote'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
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