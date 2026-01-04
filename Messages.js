import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Spinner,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { messagingAPI, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [newChatSubject, setNewChatSubject] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // URL params
  const projectId = searchParams.get("project");
  const startNew = searchParams.get("start");
  const userId = searchParams.get("userId");
  const username = searchParams.get("username");

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (startNew === "true" || userId) {
      setShowNewChatModal(true);
      if (username) setNewChatUsername(username);
    }
  }, [startNew, userId, username]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagingAPI.getConversations();
      const convos = response.data.results || response.data || [];
      setConversations(Array.isArray(convos) ? convos : []);

      if (projectId && convos.length > 0) {
        const projectConv = convos.find(
          (c) => c.project?.id === parseInt(projectId),
        );
        if (projectConv) {
          setSelectedConversation(projectConv);
          setMobileShowChat(true);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
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
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      await messagingAPI.sendMessage({
        conversation: selectedConversation.id,
        content: newMessage,
        message_type: "text",
      });
      setNewMessage("");
      loadMessages(selectedConversation.id);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setMobileShowChat(true);
  };

  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await userAPI.searchUsers({ q: query, limit: 10 });
      const users = response.data.results || response.data || [];
      setSearchResults(users.filter((u) => u.id !== user?.id));
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartNewChat = async (selectedUser) => {
    try {
      const response = await messagingAPI.createConversation({
        participants: [selectedUser.id],
        subject: newChatSubject || `Chat with ${selectedUser.username}`,
      });

      const newConv = response.data;
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setShowNewChatModal(false);
      setNewChatUsername("");
      setNewChatSubject("");
      setSearchResults([]);
      setMobileShowChat(true);
      setSearchParams({});
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.subject?.toLowerCase().includes(query) ||
      conv.participants?.some((p) => p.username?.toLowerCase().includes(query))
    );
  });

  const getOtherParticipant = (conv) => {
    return conv.participants?.find((p) => p.id !== user?.id) || {};
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        paddingTop: "100px",
        paddingBottom: "40px",
      }}
    >
      <Container fluid style={{ maxWidth: "1400px" }}>
        {/* Page Header */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
                }}
              >
                💬
              </span>
              Messages
            </h2>
            <p style={{ color: "#64748b", margin: 0 }}>
              Connect and collaborate with your team
            </p>
          </div>
          <Button
            onClick={() => setShowNewChatModal(true)}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
            }}
          >
            <span>✉️</span> New Conversation
          </Button>
        </div>

        {/* Main Chat Interface */}
        <Card
          style={{
            borderRadius: "24px",
            border: "none",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            height: "calc(100vh - 240px)",
            minHeight: "600px",
          }}
        >
          <Row className="g-0 h-100">
            {/* Conversations List */}
            <Col
              lg={4}
              md={5}
              className={`h-100 ${mobileShowChat ? "d-none d-md-block" : ""}`}
              style={{
                borderRight: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Search Header */}
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "white",
                }}
              >
                <InputGroup>
                  <InputGroup.Text
                    style={{
                      background: "#f8fafc",
                      border: "2px solid #e2e8f0",
                      borderRight: "none",
                      borderRadius: "12px 0 0 12px",
                    }}
                  >
                    🔍
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: "#f8fafc",
                      border: "2px solid #e2e8f0",
                      borderLeft: "none",
                      borderRadius: "0 12px 12px 0",
                      padding: "12px 16px",
                    }}
                  />
                </InputGroup>
              </div>

              {/* Conversations List */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  background: "#fafbfc",
                }}
              >
                {loading ? (
                  <div
                    className="text-center py-5"
                    style={{ color: "#64748b" }}
                  >
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-5" style={{ padding: "40px" }}>
                    <div
                      style={{
                        fontSize: "3rem",
                        marginBottom: "16px",
                        filter: "grayscale(1) opacity(0.5)",
                      }}
                    >
                      💬
                    </div>
                    <h6 style={{ color: "#64748b", fontWeight: 600 }}>
                      No conversations yet
                    </h6>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.875rem",
                        marginBottom: "16px",
                      }}
                    >
                      Start a conversation to connect with others
                    </p>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowNewChatModal(true)}
                      style={{ borderRadius: "8px" }}
                    >
                      Start New Chat
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const otherUser = getOtherParticipant(conv);
                    const isSelected = selectedConversation?.id === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        style={{
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          cursor: "pointer",
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
                            : "white",
                          borderBottom: "1px solid #f1f5f9",
                          borderLeft: isSelected
                            ? "4px solid #6366f1"
                            : "4px solid transparent",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseOut={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "white";
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "16px",
                            background:
                              "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "1.125rem",
                            flexShrink: 0,
                            position: "relative",
                          }}
                        >
                          {otherUser.username?.charAt(0).toUpperCase() || "?"}
                          {/* Online indicator */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: "#10b981",
                              border: "2px solid white",
                            }}
                          />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "4px",
                            }}
                          >
                            <h6
                              style={{
                                margin: 0,
                                fontWeight: 600,
                                color: "#1e293b",
                                fontSize: "0.9375rem",
                              }}
                            >
                              {otherUser.username ||
                                conv.subject ||
                                "Conversation"}
                            </h6>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                              }}
                            >
                              {conv.last_message?.created_at
                                ? formatTime(conv.last_message.created_at)
                                : ""}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.8125rem",
                                color: "#64748b",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "180px",
                              }}
                            >
                              {conv.last_message?.content || conv.subject || ""}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge
                                style={{
                                  background:
                                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                  borderRadius: "50px",
                                  padding: "4px 8px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Col>

            {/* Chat Area */}
            <Col
              lg={8}
              md={7}
              className={`h-100 ${!mobileShowChat ? "d-none d-md-flex" : "d-flex"}`}
              style={{
                flexDirection: "column",
                background: "#fafbfc",
              }}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div
                    style={{
                      padding: "20px 24px",
                      background: "white",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    {/* Back button for mobile */}
                    <Button
                      variant="link"
                      className="d-md-none p-0"
                      onClick={() => setMobileShowChat(false)}
                      style={{ color: "#64748b", fontSize: "1.25rem" }}
                    >
                      ←
                    </Button>

                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "1.125rem",
                      }}
                    >
                      {getOtherParticipant(selectedConversation)
                        .username?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h6
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          color: "#1e293b",
                        }}
                      >
                        {getOtherParticipant(selectedConversation).username ||
                          selectedConversation.subject}
                      </h6>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#10b981",
                          }}
                        />
                        <span
                          style={{ fontSize: "0.8125rem", color: "#10b981" }}
                        >
                          Online
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="light"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={() =>
                          navigate(
                            `/providers/${getOtherParticipant(selectedConversation).id}`,
                          )
                        }
                      >
                        👤
                      </Button>
                      <Button
                        variant="light"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ⋯
                      </Button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      background:
                        "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                    }}
                  >
                    {messages.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                        }}
                      >
                        <div
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2.5rem",
                            marginBottom: "16px",
                          }}
                        >
                          👋
                        </div>
                        <h6 style={{ fontWeight: 600, marginBottom: "8px" }}>
                          Start the conversation!
                        </h6>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#94a3b8",
                            textAlign: "center",
                            maxWidth: "300px",
                          }}
                        >
                          Say hello and introduce yourself. Great collaborations
                          start with a simple message.
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn = message.sender?.id === user?.id;
                        const showAvatar =
                          !isOwn &&
                          (index === 0 ||
                            messages[index - 1]?.sender?.id !==
                              message.sender?.id);

                        return (
                          <div
                            key={message.id}
                            style={{
                              display: "flex",
                              justifyContent: isOwn ? "flex-end" : "flex-start",
                              gap: "12px",
                            }}
                          >
                            {!isOwn && (
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "12px",
                                  background: showAvatar
                                    ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                    : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  flexShrink: 0,
                                  visibility: showAvatar ? "visible" : "hidden",
                                }}
                              >
                                {message.sender?.username
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                            <div
                              style={{
                                maxWidth: "70%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isOwn ? "flex-end" : "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  padding: "14px 18px",
                                  borderRadius: isOwn
                                    ? "20px 20px 6px 20px"
                                    : "20px 20px 20px 6px",
                                  background: isOwn
                                    ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                    : "white",
                                  color: isOwn ? "white" : "#1e293b",
                                  boxShadow: isOwn
                                    ? "0 4px 15px rgba(99, 102, 241, 0.3)"
                                    : "0 2px 10px rgba(0, 0, 0, 0.05)",
                                  fontSize: "0.9375rem",
                                  lineHeight: 1.5,
                                }}
                              >
                                {message.content}
                              </div>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#94a3b8",
                                  marginTop: "6px",
                                  paddingLeft: isOwn ? "0" : "4px",
                                  paddingRight: isOwn ? "4px" : "0",
                                }}
                              >
                                {formatMessageTime(message.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div
                    style={{
                      padding: "20px 24px",
                      background: "white",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <Form onSubmit={handleSendMessage}>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-end",
                        }}
                      >
                        <Button
                          variant="light"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.25rem",
                            flexShrink: 0,
                          }}
                        >
                          📎
                        </Button>
                        <div style={{ flex: 1, position: "relative" }}>
                          <Form.Control
                            ref={messageInputRef}
                            as="textarea"
                            rows={1}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                            placeholder="Type your message..."
                            style={{
                              borderRadius: "14px",
                              border: "2px solid #e2e8f0",
                              padding: "14px 18px",
                              resize: "none",
                              fontSize: "0.9375rem",
                              background: "#f8fafc",
                            }}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              newMessage.trim() && !sendingMessage
                                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                : "#e2e8f0",
                            border: "none",
                            fontSize: "1.25rem",
                            flexShrink: 0,
                            transition: "all 0.2s ease",
                          }}
                        >
                          {sendingMessage ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            "➤"
                          )}
                        </Button>
                      </div>
                    </Form>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px",
                    background:
                      "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "3.5rem",
                      marginBottom: "24px",
                    }}
                  >
                    💬
                  </div>
                  <h4
                    style={{
                      fontWeight: 700,
                      color: "#1e293b",
                      marginBottom: "12px",
                    }}
                  >
                    Select a conversation
                  </h4>
                  <p
                    style={{
                      color: "#64748b",
                      textAlign: "center",
                      maxWidth: "400px",
                      marginBottom: "24px",
                      lineHeight: 1.7,
                    }}
                  >
                    Choose a conversation from the list or start a new one to
                    connect with teammates and collaborators.
                  </p>
                  <Button
                    onClick={() => setShowNewChatModal(true)}
                    style={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      border: "none",
                      padding: "14px 28px",
                      borderRadius: "12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <span>✉️</span> Start New Conversation
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card>
      </Container>

      {/* New Chat Modal */}
      <Modal
        show={showNewChatModal}
        onHide={() => {
          setShowNewChatModal(false);
          setSearchResults([]);
          setNewChatUsername("");
          setNewChatSubject("");
          setSearchParams({});
        }}
        centered
        size="md"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            border: "none",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <Modal.Title
            style={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>✉️</span>
            New Conversation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "24px" }}>
          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 600, color: "#1e293b" }}>
              Search for a user
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Type username or name..."
              value={newChatUsername}
              onChange={(e) => {
                setNewChatUsername(e.target.value);
                handleSearchUsers(e.target.value);
              }}
              style={{
                borderRadius: "12px",
                padding: "14px 18px",
                border: "2px solid #e2e8f0",
              }}
            />
          </Form.Group>

          {searchingUsers && (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                marginBottom: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
              }}
            >
              {searchResults.map((searchUser) => (
                <div
                  key={searchUser.id}
                  onClick={() => handleStartNewChat(searchUser)}
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                    transition: "background 0.2s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    {searchUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {searchUser.username}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                      {searchUser.user_type === "service_provider"
                        ? "Service Provider"
                        : "Client"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Form.Group>
            <Form.Label style={{ fontWeight: 600, color: "#1e293b" }}>
              Subject (optional)
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="What's this conversation about?"
              value={newChatSubject}
              onChange={(e) => setNewChatSubject(e.target.value)}
              style={{
                borderRadius: "12px",
                padding: "14px 18px",
                border: "2px solid #e2e8f0",
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ border: "none", padding: "16px 24px 24px" }}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowNewChatModal(false);
              setSearchResults([]);
              setNewChatUsername("");
              setNewChatSubject("");
            }}
            style={{ borderRadius: "10px", padding: "10px 20px" }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Messages;
