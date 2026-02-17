import React, { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import { disputesAPI, getErrorMessage } from "../../services/api";

const DisputeButton = ({
  projectId,
  projectTitle = "",
  providerId = null,
  requesterId = null,
  variant = "outline-danger",
  size = "sm",
  className = "",
  buttonText = "Open Dispute",
  icon = "⚠️",
  onDisputeCreated,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    dispute_type: "payment",
    title: "",
    description: "",
    disputed_amount: "",
    priority: "medium",
  });

  const disputeTypes = [
    { value: "payment", label: "Payment Issue", icon: "💰" },
    { value: "quality", label: "Quality of Work", icon: "📊" },
    { value: "delivery", label: "Delivery/Timeline", icon: "📅" },
    { value: "communication", label: "Communication", icon: "💬" },
    { value: "scope", label: "Scope Change", icon: "📋" },
    { value: "cancellation", label: "Cancellation Request", icon: "❌" },
    { value: "refund", label: "Refund Request", icon: "💸" },
    { value: "other", label: "Other Issue", icon: "❓" },
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "secondary", description: "Non-urgent issue" },
    { value: "medium", label: "Medium", color: "info", description: "Standard priority" },
    { value: "high", label: "High", color: "warning", description: "Needs attention soon" },
    { value: "urgent", label: "Urgent", color: "danger", description: "Requires immediate action" },
  ];

  const handleOpen = () => {
    setShowModal(true);
    setError("");
    setSuccess("");
    setFormData({
      dispute_type: "payment",
      title: "",
      description: "",
      disputed_amount: "",
      priority: "medium",
    });
  };

  const handleClose = () => {
    setShowModal(false);
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Please enter a title for the dispute");
      return false;
    }
    if (formData.title.length < 10) {
      setError("Title must be at least 10 characters");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Please describe the dispute");
      return false;
    }
    if (formData.description.length < 50) {
      setError("Description must be at least 50 characters for proper review");
      return false;
    }
    if (formData.disputed_amount && parseFloat(formData.disputed_amount) < 0) {
      setError("Disputed amount cannot be negative");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const disputeData = {
        project: projectId,
        dispute_type: formData.dispute_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      };

      if (formData.disputed_amount) {
        disputeData.disputed_amount = parseFloat(formData.disputed_amount);
      }

      if (providerId) {
        disputeData.respondent = providerId;
      }

      const response = await disputesAPI.createDispute(disputeData);

      setSuccess("Dispute submitted successfully. Our team will review it shortly.");

      if (onDisputeCreated) {
        onDisputeCreated(response.data);
      }

      // Close modal after short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Error creating dispute:", err);
      setError(getErrorMessage(err) || "Failed to create dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDisputeType = () => {
    return disputeTypes.find((t) => t.value === formData.dispute_type);
  };

  const getSelectedPriority = () => {
    return priorityLevels.find((p) => p.value === formData.priority);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpen}
        disabled={disabled || !projectId}
      >
        <span className="me-1">{icon}</span>
        {buttonText}
      </Button>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <span className="me-2">⚠️</span>
            Open a Dispute
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Info Banner */}
          <Alert variant="info" className="mb-4">
            <strong>ℹ️ Before opening a dispute:</strong>
            <ul className="mb-0 mt-2">
              <li>Try to resolve the issue directly with the other party first</li>
              <li>Gather any evidence (messages, files, screenshots) to support your case</li>
              <li>Be specific and factual in your description</li>
            </ul>
          </Alert>

          {projectTitle && (
            <div className="mb-3 p-3 bg-light rounded">
              <strong>Project:</strong> {projectTitle}
            </div>
          )}

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <span className="me-2">✅</span>
              {success}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Dispute Type */}
            <Form.Group className="mb-4">
              <Form.Label>
                <strong>What is this dispute about?</strong>
              </Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {disputeTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={formData.dispute_type === type.value ? "danger" : "outline-secondary"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, dispute_type: type.value })}
                    className="d-flex align-items-center"
                  >
                    <span className="me-1">{type.icon}</span>
                    {type.label}
                  </Button>
                ))}
              </div>
              {getSelectedDisputeType() && (
                <Form.Text className="text-muted">
                  Selected: {getSelectedDisputeType().icon} {getSelectedDisputeType().label}
                </Form.Text>
              )}
            </Form.Group>

            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Dispute Title *</strong>
              </Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief summary of the issue (e.g., 'Work not delivered as described')"
                maxLength={200}
              />
              <Form.Text className="text-muted">
                {formData.title.length}/200 characters
              </Form.Text>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Describe the Issue *</strong>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the issue. Include:
- What was agreed upon
- What actually happened
- What resolution you're seeking
- Any relevant dates or communications"
              />
              <Form.Text className="text-muted">
                {formData.description.length} characters (minimum 50)
              </Form.Text>
            </Form.Group>

            <Row>
              {/* Disputed Amount */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Disputed Amount (Optional)</strong>
                  </Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="disputed_amount"
                      value={formData.disputed_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    The financial amount in question, if applicable
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Priority */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Priority Level</strong>
                  </Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {priorityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </Form.Select>
                  <div className="mt-2">
                    <Badge bg={getSelectedPriority()?.color || "info"}>
                      {getSelectedPriority()?.label || "Medium"} Priority
                    </Badge>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Disclaimer */}
            <Alert variant="warning" className="mt-3">
              <small>
                <strong>Note:</strong> By submitting this dispute, you agree to cooperate with
                our resolution process. False or malicious disputes may result in account
                penalties. All communications will be reviewed by our admin team.
              </small>
            </Alert>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                <span className="me-2">⚠️</span>
                Submit Dispute
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DisputeButton;
