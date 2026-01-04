import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { proposalsAPI, projectsAPI, skillsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProposalAIHelper from "../components/ai/ProposalAIHelper";

const SubmitProposal = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [formData, setFormData] = useState({
    project_id: projectId || "",
    cover_letter: "",
    proposed_price: "",
    proposed_timeline: "",
    currency: "USD",
    milestones: [],
    terms_and_conditions: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [userSkills, setUserSkills] = useState([]);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `/proposals/create?project=${projectId}`,
          message: "Please login to submit a proposal",
        },
      });
      return;
    }

    // Check user type
    if (user && user.user_type !== "service_provider") {
      setErrors({
        auth: "Only service providers can submit proposals. Please switch to a provider account.",
      });
    }

    if (projectId) {
      loadProject();
    } else {
      setProjectLoading(false);
    }

    // Load user skills for AI matching
    loadUserSkills();
  }, [isAuthenticated, user, projectId, navigate]);

  const loadUserSkills = async () => {
    try {
      const response = await skillsAPI.getUserSkills();
      setUserSkills(response.data?.results || response.data || []);
    } catch (error) {
      console.error("Error loading user skills:", error);
    }
  };

  const loadProject = async () => {
    try {
      setProjectLoading(true);
      const response = await projectsAPI.getProject(projectId);
      setProject(response.data);
      setFormData((prev) => ({
        ...prev,
        project_id: projectId,
        currency: response.data.budget_currency || "USD",
      }));

      // Check if project is published
      if (response.data.status !== "published") {
        setErrors({
          project: "This project is not open for proposals.",
        });
      }

      // Check if user is the project owner
      if (response.data.client?.id === user?.id) {
        setErrors({
          project: "You cannot submit a proposal to your own project.",
        });
      }
    } catch (error) {
      console.error("Error loading project:", error);
      setErrors({
        project: "Failed to load project details. The project may not exist.",
      });
    } finally {
      setProjectLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle AI suggestion application
  const handleAISuggestion = (suggestion) => {
    if (!suggestion) return;

    const updates = { ...formData };

    if (suggestion.cover_letter) {
      updates.cover_letter = suggestion.cover_letter;
    }
    if (suggestion.proposed_price) {
      updates.proposed_price = suggestion.proposed_price;
    }
    if (suggestion.proposed_timeline) {
      updates.proposed_timeline = suggestion.proposed_timeline;
    }

    setFormData(updates);
    setSuccessMessage("AI suggestions applied! Review and adjust as needed.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.project_id) {
      newErrors.project_id = "Please select a project";
    }

    if (!formData.cover_letter.trim()) {
      newErrors.cover_letter = "Cover letter is required";
    } else if (formData.cover_letter.length < 50) {
      newErrors.cover_letter = "Cover letter must be at least 50 characters";
    }

    if (!formData.proposed_price || parseFloat(formData.proposed_price) <= 0) {
      newErrors.proposed_price = "Please enter a valid price";
    }

    if (project) {
      const price = parseFloat(formData.proposed_price);
      if (price < parseFloat(project.budget_min)) {
        newErrors.proposed_price = `Price is below minimum budget ($${project.budget_min})`;
      }
      if (price > parseFloat(project.budget_max) * 1.5) {
        newErrors.proposed_price = `Price is too far above maximum budget ($${project.budget_max})`;
      }
    }

    if (
      !formData.proposed_timeline ||
      parseInt(formData.proposed_timeline) <= 0
    ) {
      newErrors.proposed_timeline = "Please enter a valid timeline (days)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = {
        project_id: parseInt(formData.project_id),
        cover_letter: formData.cover_letter.trim(),
        proposed_price: parseFloat(formData.proposed_price),
        proposed_timeline: parseInt(formData.proposed_timeline),
        currency: formData.currency,
        terms_and_conditions: formData.terms_and_conditions.trim(),
        milestones: formData.milestones,
      };

      console.log("Submitting proposal:", data);

      const response = await proposalsAPI.createProposal(data);

      console.log("Proposal created:", response.data);

      setSuccessMessage(
        "Proposal submitted successfully! Redirecting to your proposals...",
      );

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/proposals");
      }, 2000);
    } catch (error) {
      console.error("Error submitting proposal:", error);

      if (error.response?.data) {
        const serverErrors = error.response.data;

        if (typeof serverErrors === "object") {
          // Handle field-specific errors
          const fieldErrors = {};

          Object.keys(serverErrors).forEach((key) => {
            if (Array.isArray(serverErrors[key])) {
              fieldErrors[key] = serverErrors[key][0];
            } else if (typeof serverErrors[key] === "string") {
              fieldErrors[key] = serverErrors[key];
            }
          });

          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else if (serverErrors.error) {
            setErrors({ non_field_errors: serverErrors.error });
          } else if (serverErrors.detail) {
            setErrors({ non_field_errors: serverErrors.detail });
          }
        } else if (typeof serverErrors === "string") {
          setErrors({ non_field_errors: serverErrors });
        }
      } else if (error.message) {
        setErrors({ non_field_errors: error.message });
      } else {
        setErrors({
          non_field_errors: "Failed to submit proposal. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (projectLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading project details...</p>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">
                <span className="me-2">📝</span>
                Submit Proposal
              </h2>
            </Card.Header>
            <Card.Body>
              {/* Auth Error */}
              {errors.auth && (
                <Alert variant="warning">
                  <strong>Note:</strong> {errors.auth}
                </Alert>
              )}

              {/* Project Error */}
              {errors.project && (
                <Alert variant="danger">
                  <strong>Error:</strong> {errors.project}
                  <div className="mt-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => navigate("/find-jobs")}
                    >
                      Browse Available Projects
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Success Message */}
              {successMessage && (
                <Alert variant="success">
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    {successMessage}
                  </div>
                </Alert>
              )}

              {/* Non-field Errors */}
              {errors.non_field_errors && (
                <Alert variant="danger">{errors.non_field_errors}</Alert>
              )}

              {/* Project Info Card */}
              {project && !errors.project && (
                <Card className="mb-4 bg-light border-0">
                  <Card.Body>
                    <h5 className="mb-2">{project.title}</h5>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <Badge bg="primary">{project.category?.name}</Badge>
                      <Badge bg="info">{project.priority} priority</Badge>
                      {project.is_remote && <Badge bg="success">Remote</Badge>}
                    </div>
                    <p className="text-muted small mb-2">
                      {project.description?.substring(0, 200)}...
                    </p>
                    <Row className="mt-3">
                      <Col sm={6}>
                        <small className="text-muted">Budget Range:</small>
                        <div className="fw-bold text-success">
                          {project.budget_currency} {project.budget_min} -{" "}
                          {project.budget_max}
                        </div>
                      </Col>
                      <Col sm={6}>
                        <small className="text-muted">Deadline:</small>
                        <div className="fw-bold">
                          {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* AI Proposal Assistant */}
              {project && !errors.project && !errors.auth && (
                <Card className="mb-4 border-success">
                  <Card.Header className="bg-success bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <span className="me-2">🤖</span>
                        AI Proposal Assistant
                      </h5>
                      <ProposalAIHelper
                        project={project}
                        onSuggestionGenerated={handleAISuggestion}
                        userSkills={userSkills}
                      />
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted mb-0 small">
                      Let our AI help you craft a compelling proposal with
                      optimized pricing, timeline suggestions, and a
                      personalized cover letter based on the project
                      requirements and your skills.
                    </p>
                  </Card.Body>
                </Card>
              )}

              {/* Proposal Form */}
              {!errors.project && !errors.auth && (
                <Form onSubmit={handleSubmit}>
                  {/* Project ID (hidden if project is loaded) */}
                  {!projectId && (
                    <Form.Group className="mb-3">
                      <Form.Label>Project ID *</Form.Label>
                      <Form.Control
                        type="number"
                        name="project_id"
                        value={formData.project_id}
                        onChange={handleChange}
                        placeholder="Enter project ID"
                        required
                        isInvalid={!!errors.project_id}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.project_id}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        You can find project IDs on the{" "}
                        <a href="/find-jobs">Job Marketplace</a>
                      </Form.Text>
                    </Form.Group>
                  )}

                  {/* Cover Letter */}
                  <Form.Group className="mb-3">
                    <Form.Label>Cover Letter *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={8}
                      name="cover_letter"
                      value={formData.cover_letter}
                      onChange={handleChange}
                      placeholder="Introduce yourself and explain why you're the best fit for this project. Include:
- Your relevant experience
- How you plan to approach the project
- Why you're interested in this opportunity
- Any questions you have for the client"
                      required
                      isInvalid={!!errors.cover_letter}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.cover_letter}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      {formData.cover_letter.length} characters (minimum 50)
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Your Price *</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">
                            {formData.currency === "USD"
                              ? "$"
                              : formData.currency === "EUR"
                                ? "€"
                                : "£"}
                          </span>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="1"
                            name="proposed_price"
                            value={formData.proposed_price}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                            isInvalid={!!errors.proposed_price}
                          />
                        </div>
                        {errors.proposed_price && (
                          <div className="text-danger small mt-1">
                            {errors.proposed_price}
                          </div>
                        )}
                        {project && (
                          <Form.Text className="text-muted">
                            Budget: {project.budget_currency}{" "}
                            {project.budget_min} - {project.budget_max}
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Timeline (Days) *</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          name="proposed_timeline"
                          value={formData.proposed_timeline}
                          onChange={handleChange}
                          placeholder="e.g., 7"
                          required
                          isInvalid={!!errors.proposed_timeline}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.proposed_timeline}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          How many days to complete?
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency</Form.Label>
                        <Form.Select
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Terms and Conditions */}
                  <Form.Group className="mb-4">
                    <Form.Label>Terms & Conditions (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="terms_and_conditions"
                      value={formData.terms_and_conditions}
                      onChange={handleChange}
                      placeholder="Any specific terms, conditions, or notes for the client..."
                    />
                    <Form.Text className="text-muted">
                      Include any special conditions, revision policies, or
                      payment terms.
                    </Form.Text>
                  </Form.Group>

                  <hr />

                  {/* Submit Buttons */}
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <div className="text-end">
                      <small className="text-muted me-3">
                        Your proposal will be sent to the client immediately
                      </small>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || !!errors.project || !!errors.auth}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <span className="me-2">📤</span>
                            Submit Proposal
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>

          {/* Tips Card */}
          <Card className="mt-4 border-0 bg-light">
            <Card.Body>
              <h6 className="mb-3">
                <span className="me-2">💡</span>
                Tips for a Winning Proposal
              </h6>
              <ul className="small text-muted mb-0">
                <li>
                  Personalize your cover letter - mention specific details from
                  the project
                </li>
                <li>
                  Be realistic with your pricing - competitive but fair for your
                  skills
                </li>
                <li>
                  Provide a clear timeline with milestones if it's a longer
                  project
                </li>
                <li>Highlight relevant experience and past work</li>
                <li>
                  Ask thoughtful questions to show you've read the requirements
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SubmitProposal;
