import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, ListGroup, Badge } from 'react-bootstrap';
import { messagingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Messaging = ({ projectId, conversationId: initialConversationId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [projectId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagingAPI.getConversations();
      const convos = response.data.results || response.data || [];
      const conversationsArray = Array.isArray(convos) ? convos : [];
      
      if (projectId && conversationsArray.length > 0) {
        const projectConv = conversationsArray.find(c => c.project?.id === parseInt(projectId));
        if (projectConv) {
          setSelectedConversation(projectConv);
        }
      } else if (initialConversationId && conversationsArray.length > 0) {
        const conv = conversationsArray.find(c => c.id === parseInt(initialConversationId));
        if (conv) {
          setSelectedConversation(conv);
        }
      }
      
      setConversations(conversationsArray);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const response = await messagingAPI.getMessages(convId);
      const msgs = response.data.results || response.data || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await messagingAPI.sendMessage({
        conversation: selectedConversation.id,
        content: newMessage,
        message_type: 'text',
      });
      setNewMessage('');
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="d-flex" style={{ height: '600px' }}>
      <div style={{ width: '300px', borderRight: '1px solid #dee2e6' }}>
        <Card.Header>Conversations</Card.Header>
        <ListGroup variant="flush" style={{ maxHeight: '550px', overflowY: 'auto' }}>
          {loading ? (
            <ListGroup.Item>Loading conversations...</ListGroup.Item>
          ) : conversations.length === 0 ? (
            <ListGroup.Item className="text-muted">No conversations yet</ListGroup.Item>
          ) : (
            conversations.map(conv => (
            <ListGroup.Item
              key={conv.id}
              action
              active={selectedConversation?.id === conv.id}
              onClick={() => setSelectedConversation(conv)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <strong>{conv.subject || `Conversation ${conv.id}`}</strong>
                {conv.unread_count > 0 && (
                  <Badge bg="danger" className="ms-2">{conv.unread_count}</Badge>
                )}
              </div>
              {conv.last_message && (
                <small className="text-muted">
                  {conv.last_message.content.substring(0, 50)}...
                </small>
              )}
            </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </div>

      <div className="flex-grow-1 d-flex flex-column">
        {selectedConversation ? (
          <>
            <Card.Header>
              {selectedConversation.subject || `Conversation ${selectedConversation.id}`}
            </Card.Header>
            <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map(message => (
                <div
                  key={message.id}
                  className={`mb-3 ${message.sender?.id === user?.id ? 'text-end' : ''}`}
                >
                  <div
                    className={`d-inline-block p-2 rounded ${
                      message.sender?.id === user?.id
                        ? 'bg-primary text-white'
                        : 'bg-light'
                    }`}
                    style={{ maxWidth: '70%' }}
                  >
                    <div className="small">
                      <strong>{message.sender?.username}</strong>
                    </div>
                    <div>{message.content}</div>
                    <div className="small mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <Card.Footer>
              <Form onSubmit={handleSendMessage}>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button type="submit" variant="primary" className="ms-2">
                    Send
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-muted">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;

