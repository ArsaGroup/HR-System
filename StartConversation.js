import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Alert,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import {
  messagingAPI,
  projectsAPI,
  userAPI,
  providerAPI,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const StartConversation = ({
  show,
  onHide,
  projectId,
  userId,
  initialUsername,
}) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Load project info if projectId is provided
  useEffect(() => {
    if (show && projectId) {
      loadProject();
    }
  }, [show, projectId]);

  // Load user info if userId is provided
  useEffect(() => {
    if (show && userId && !selectedUser) {
      loadUserById(userId, initialUsername);
    }
  }, [show, userId, initialUsername]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!show) {
      // Don't reset immediately to avoid flicker
      const timeout = setTimeout(() => {
        setSelectedUser(null);
        setSearchQuery("");
        setSearchResults([]);
        setError("");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  // Handle search with debounce
  useEffect(() => {
    if (!show) return;
    if (selectedUser) {
      setSearchResults([]);
      return;
    }
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      performUserSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedUser, show]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getProject(projectId);
      setProject(response.data);
      setSubject(`Re: ${response.data.title}`);
    } catch (error) {
      console.error("Error loading project:", error);
    }
  };

  const loadUserById = async (id, usernameHint) => {
    try {
      setLoadingUser(true);
      setError("");

      // If we have a username hint, use it immediately for better UX
      if (usernameHint) {
        setSelectedUser({
          id: parseInt(id),
          username: usernameHint,
          email: "",
        });
      }

      // Try to get user from provider API first (works for service providers)
      try {
        const response = await providerAPI.getProviderProfile(id);
        if (response.data) {
          setSelectedUser({
            id: response.data.id,
            username: response.data.username || usernameHint || `User #${id}`,
            email: response.data.email || "",
            profile: response.data.profile,
          });
          return;
        }
      } catch (providerErr) {
        // Not a provider or not found, try search
        console.log("Provider lookup failed, trying search...");
      }

      // Fallback: search for the user
      const searchResponse = await userAPI.searchUsers({ q: "", limit: 50 });
      const users = searchResponse.data.results || searchResponse.data || [];
      const foundUser = users.find((u) => u.id === parseInt(id));

      if (foundUser) {
        setSelectedUser({
          id: foundUser.id,
          username: foundUser.username || usernameHint || `User #${id}`,
          email: foundUser.email || "",
          profile: foundUser.profile,
        });
      } else {
        // User not found in search, set with username hint or ID
        setSelectedUser({
          id: parseInt(id),
          username: usernameHint || `User #${id}`,
          email: "",
        });
      }
    } catch (error) {
      console.error("Error loading user:", error);
      // Still set the user with the ID and hint so conversation can proceed
      setSelectedUser({
        id: parseInt(id),
        username: usernameHint || `User #${id}`,
        email: "",
      });
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetUserId =
      selectedUser?.id || (userId ? parseInt(userId, 10) : null);

    if (!targetUserId) {
      setError("Please select who you want to message.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject for the conversation.");
      return;
    }

    if (!initialMessage.trim()) {
      setError("Please enter your message.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create conversation
      const conversationData = {
        subject: subject.trim(),
        project_id: projectId ? parseInt(projectId) : null,
        participant_ids: [targetUserId],
      };

      const convResponse =
        await messagingAPI.createConversation(conversationData);
      const conversation = convResponse.data;

      // Send initial message
      await messagingAPI.sendMessage({
        conversation: conversation.id,
        content: initialMessage.trim(),
        message_type: "text",
      });

      // Reset form
      setSubject("");
      setInitialMessage("");
      setSelectedUser(null);
      setSearchResults([]);
      setSearchQuery("");
      setProject(null);

      // Close modal
      onHide();

      // Reload messages page to show new conversation
      if (window.location.pathname === "/messages") {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Failed to start conversation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const performUserSearch = async (query) => {
    try {
      setSearching(true);
      const response = await userAPI.searchUsers({ q: query, limit: 10 });
      const data = response.data.results || response.data || [];
      // Filter out current user from results
      const filteredResults = Array.isArray(data)
        ? data.filter((u) => u.id !== user?.id)
        : [];
      setSearchResults(filteredResults);
    } catch (err) {
      console.error("User search failed", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Start New Conversation</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {project && (
            <Alert variant="info" className="mb-3">
              <strong>📋 Project:</strong> {project.title}
            </Alert>
          )}

          {/* User Selection */}
          <Form.Group className="mb-3">
            <Form.Label>To *</Form.Label>

            {loadingUser ? (
              <div className="d-flex align-items-center p-3 border rounded bg-light">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Loading user info...</span>
              </div>
            ) : selectedUser ? (
              <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                <div>
                  <div className="fw-bold">{selectedUser.username}</div>
                  {selectedUser.email && (
                    <div className="text-muted small">{selectedUser.email}</div>
                  )}
                  {selectedUser.profile?.provider_mode === "online" && (
                    <span className="badge bg-success mt-1">🟢 Online</span>
                  )}
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  type="button"
                  onClick={handleClearSelection}
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Form.Control
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or email..."
                  autoFocus
                />
                <Form.Text className="text-muted">
                  Type at least 2 characters to search
                </Form.Text>

                {searching && (
                  <div className="text-muted small mt-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Searching...
                  </div>
                )}

                {!searching &&
                  searchQuery.length >= 2 &&
                  searchResults.length === 0 && (
                    <Alert variant="warning" className="mt-2 mb-0">
                      No users found matching "{searchQuery}"
                    </Alert>
                  )}

                {searchResults.length > 0 && (
                  <ListGroup
                    className="mt-2"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    {searchResults.map((result) => (
                      <ListGroup.Item
                        key={result.id}
                        action
                        onClick={() => {
                          setSelectedUser(result);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-bold">{result.username}</div>
                          <div className="text-muted small">
                            {result.user_type === "service_provider"
                              ? "👨‍💻 Provider"
                              : "👤 Requester"}
                            {result.email && ` • ${result.email}`}
                          </div>
                        </div>
                        {result.profile?.provider_mode === "online" && (
                          <span className="badge bg-success">Online</span>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Subject *</Form.Label>
            <Form.Control
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this conversation about?"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Type your message here..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || loadingUser || !selectedUser}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              "📨 Send Message"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default StartConversation;
