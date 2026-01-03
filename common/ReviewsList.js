import React, { useState } from "react";
import {
  Card,
  Badge,
  Button,
  Row,
  Col,
  ProgressBar,
  Alert,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import { ScoreStars } from "./ProviderScoreDisplay";

const ReviewsList = ({
  reviews = [],
  summary = null,
  loading = false,
  error = null,
  showSummary = true,
  showFilters = true,
  onMarkHelpful,
  onFlagReview,
  onRespond,
  allowResponses = false,
  currentUserId = null,
  emptyMessage = "No reviews yet",
}) => {
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((review) => {
      if (filterRating === "all") return true;
      return Math.floor(review.overall_rating) === parseInt(filterRating);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "highest":
          return b.overall_rating - a.overall_rating;
        case "lowest":
          return a.overall_rating - b.overall_rating;
        case "helpful":
          return (b.helpful_count || 0) - (a.helpful_count || 0);
        default:
          return 0;
      }
    });

  // Calculate rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      const rating = Math.round(review.overall_rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalReviews
      : 0;

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleOpenResponseModal = (review) => {
    setSelectedReview(review);
    setResponseText("");
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedReview || !onRespond) return;

    setSubmittingResponse(true);
    try {
      await onRespond(selectedReview.id, responseText.trim());
      setShowResponseModal(false);
      setSelectedReview(null);
      setResponseText("");
    } catch (err) {
      console.error("Error submitting response:", err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <span className="me-2">⚠️</span>
        {error}
      </Alert>
    );
  }

  return (
    <div className="reviews-list">
      {/* Summary Section */}
      {showSummary && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={4} className="text-center border-end">
                <div className="mb-2">
                  <span
                    style={{
                      fontSize: "3rem",
                      fontWeight: "bold",
                      color: "#ffc107",
                    }}
                  >
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted">/5</span>
                </div>
                <ScoreStars rating={averageRating} size="lg" />
                <p className="text-muted mt-2 mb-0">
                  Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </Col>
              <Col md={8}>
                <h6 className="mb-3">Rating Distribution</h6>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="d-flex align-items-center mb-2">
                      <span className="me-2" style={{ width: "20px" }}>
                        {rating}★
                      </span>
                      <ProgressBar
                        now={percentage}
                        variant={rating >= 4 ? "success" : rating >= 3 ? "info" : "warning"}
                        style={{ height: "10px", flex: 1 }}
                      />
                      <span className="ms-2 text-muted" style={{ width: "40px" }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </Col>
            </Row>

            {/* Category Ratings from Summary */}
            {summary?.category_averages && (
              <div className="mt-4 pt-3 border-top">
                <h6 className="mb-3">Rating Categories</h6>
                <Row>
                  {Object.entries(summary.category_averages).map(([category, rating]) => (
                    <Col md={4} key={category} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-capitalize">
                          {category.replace(/_/g, " ").replace("rating", "")}
                        </span>
                        <div className="d-flex align-items-center">
                          <ScoreStars rating={rating} size="sm" />
                          <span className="ms-1 text-muted small">
                            ({parseFloat(rating).toFixed(1)})
                          </span>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Filters */}
      {showFilters && reviews.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex gap-2 align-items-center">
            <Form.Select
              size="sm"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Form.Select>
            <Form.Select
              size="sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </Form.Select>
          </div>
          <span className="text-muted small">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </span>
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card className="border-0 bg-light">
          <Card.Body className="text-center py-5">
            <span style={{ fontSize: "3rem" }}>📝</span>
            <h5 className="mt-3">{emptyMessage}</h5>
            <p className="text-muted mb-0">
              Reviews will appear here once they are submitted.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="reviews-items">
          {filteredReviews.map((review, idx) => (
            <Card key={review.id || idx} className="mb-3 border-0 shadow-sm">
              <Card.Body>
                {/* Review Header */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "45px",
                        height: "45px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {review.reviewer_name?.[0]?.toUpperCase() ||
                        review.reviewer?.username?.[0]?.toUpperCase() ||
                        "?"}
                    </div>
                    <div>
                      <h6 className="mb-0">
                        {review.reviewer_name ||
                          review.reviewer?.username ||
                          "Anonymous"}
                      </h6>
                      <small className="text-muted">
                        {formatDate(review.created_at)}
                        {review.is_verified && (
                          <Badge bg="success" className="ms-2">
                            ✓ Verified
                          </Badge>
                        )}
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    <ScoreStars rating={review.overall_rating} />
                    <div className="small text-muted mt-1">
                      {parseFloat(review.overall_rating).toFixed(1)}/5
                    </div>
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h6 className="mb-2">{review.title}</h6>
                )}

                {/* Review Comment */}
                <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
                  {review.comment || review.content || "No comment provided."}
                </p>

                {/* Category Ratings */}
                {(review.quality_rating ||
                  review.communication_rating ||
                  review.timeliness_rating ||
                  review.professionalism_rating) && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <Row className="small">
                      {review.quality_rating && (
                        <Col xs={6} md={3}>
                          <span className="text-muted">Quality:</span>{" "}
                          <ScoreStars rating={review.quality_rating} size="sm" />
                        </Col>
                      )}
                      {review.communication_rating && (
                        <Col xs={6} md={3}>
                          <span className="text-muted">Communication:</span>{" "}
                          <ScoreStars rating={review.communication_rating} size="sm" />
                        </Col>
                      )}
                      {review.timeliness_rating && (
                        <Col xs={6} md={3}>
                          <span className="text-muted">Timeliness:</span>{" "}
                          <ScoreStars rating={review.timeliness_rating} size="sm" />
                        </Col>
                      )}
                      {review.professionalism_rating && (
                        <Col xs={6} md={3}>
                          <span className="text-muted">Professionalism:</span>{" "}
                          <ScoreStars rating={review.professionalism_rating} size="sm" />
                        </Col>
                      )}
                    </Row>
                  </div>
                )}

                {/* Would Recommend Badge */}
                {review.would_recommend !== undefined && (
                  <Badge bg={review.would_recommend ? "success" : "secondary"} className="mb-3">
                    {review.would_recommend ? "✓ Would Recommend" : "✗ Would Not Recommend"}
                  </Badge>
                )}

                {/* Review Response */}
                {review.response && (
                  <div className="mt-3 p-3 bg-light rounded border-start border-primary border-4">
                    <div className="d-flex align-items-center mb-2">
                      <Badge bg="primary" className="me-2">
                        Provider Response
                      </Badge>
                      <small className="text-muted">
                        {formatDate(review.response.created_at)}
                      </small>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                      {review.response.content || review.response.text}
                    </p>
                  </div>
                )}

                {/* Review Actions */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <div className="d-flex gap-2">
                    {onMarkHelpful && (
                      <Button
                        variant={review.user_marked_helpful ? "success" : "outline-secondary"}
                        size="sm"
                        onClick={() => onMarkHelpful(review.id, !review.user_marked_helpful)}
                      >
                        <span className="me-1">👍</span>
                        Helpful ({review.helpful_count || 0})
                      </Button>
                    )}
                    {onFlagReview && currentUserId !== review.reviewer?.id && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onFlagReview(review.id)}
                      >
                        <span className="me-1">🚩</span>
                        Report
                      </Button>
                    )}
                  </div>

                  {allowResponses &&
                    !review.response &&
                    currentUserId === review.reviewee?.id && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenResponseModal(review)}
                      >
                        <span className="me-1">💬</span>
                        Respond
                      </Button>
                    )}
                </div>

                {/* Project Reference */}
                {review.project && (
                  <div className="mt-2 small text-muted">
                    <span className="me-1">📋</span>
                    Project: {review.project.title || review.project_title}
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">💬</span>
            Respond to Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReview && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <div className="d-flex justify-content-between mb-2">
                  <strong>{selectedReview.reviewer_name || "Reviewer"}</strong>
                  <ScoreStars rating={selectedReview.overall_rating} size="sm" />
                </div>
                <p className="mb-0 small">
                  {selectedReview.comment?.substring(0, 150)}
                  {selectedReview.comment?.length > 150 ? "..." : ""}
                </p>
              </div>

              <Form.Group>
                <Form.Label>Your Response</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write a professional response to this review..."
                />
                <Form.Text className="text-muted">
                  Your response will be visible to everyone viewing this review.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitResponse}
            disabled={!responseText.trim() || submittingResponse}
          >
            {submittingResponse ? (
              <>
                <Spinner size="sm" className="me-1" />
                Submitting...
              </>
            ) : (
              "Submit Response"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReviewsList;
