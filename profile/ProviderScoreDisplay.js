import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  ProgressBar,
  Spinner,
  Alert,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { scoresAPI, reviewsAPI, getErrorMessage } from "../../services/api";

const ProviderScoreDisplay = ({ userId, compact = false }) => {
  const [score, setScore] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      loadScoreData();
    }
  }, [userId]);

  const loadScoreData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load score and review summary in parallel
      const [scoreResponse, reviewResponse] = await Promise.all([
        scoresAPI.getPublicScore(userId).catch(() => ({ data: null })),
        reviewsAPI.getUserReviewSummary(userId).catch(() => ({ data: null })),
      ]);

      setScore(scoreResponse.data);
      setReviewSummary(reviewResponse.data);
    } catch (err) {
      console.error("Failed to load score data:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      1: "secondary",
      2: "info",
      3: "primary",
      4: "warning",
      5: "success",
    };
    return colors[level] || "secondary";
  };

  const getLevelIcon = (level) => {
    const icons = {
      1: "🌱",
      2: "⭐",
      3: "🌟",
      4: "💫",
      5: "👑",
    };
    return icons[level] || "🌱";
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <span className="stars">
        {"★".repeat(fullStars)}
        {hasHalf && "½"}
        {"☆".repeat(emptyStars)}
      </span>
    );
  };

  const renderRatingBar = (label, count, total, color) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="d-flex align-items-center mb-1" key={label}>
        <span className="me-2" style={{ width: "20px" }}>
          {label}★
        </span>
        <ProgressBar
          now={percentage}
          variant={color}
          style={{ height: "8px", flex: 1 }}
          className="me-2"
        />
        <span className="text-muted small" style={{ width: "30px" }}>
          {count}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" size="sm" />
          <p className="text-muted mt-2 mb-0 small">Loading score...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" className="mb-0">
        {error}
      </Alert>
    );
  }

  // Default values if no score data
  const scoreData = score || {
    total_score: 0,
    average_rating: 0,
    total_reviews: 0,
    total_projects_completed: 0,
    level: 1,
    level_title: "Newcomer",
  };

  // Compact display for cards/lists
  if (compact) {
    return (
      <div className="provider-score-compact d-flex align-items-center gap-2">
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              {scoreData.level_title} - Level {scoreData.level}
            </Tooltip>
          }
        >
          <Badge bg={getLevelColor(scoreData.level)} className="py-1 px-2">
            {getLevelIcon(scoreData.level)} {Math.round(scoreData.total_score)}
          </Badge>
        </OverlayTrigger>

        {scoreData.total_reviews > 0 && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {scoreData.average_rating.toFixed(1)} average from{" "}
                {scoreData.total_reviews} reviews
              </Tooltip>
            }
          >
            <span className="text-warning">
              {renderStars(scoreData.average_rating)}
              <span className="text-muted ms-1 small">
                ({scoreData.total_reviews})
              </span>
            </span>
          </OverlayTrigger>
        )}
      </div>
    );
  }

  // Full display for profile pages
  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0">
          {getLevelIcon(scoreData.level)} Provider Score
        </h5>
      </Card.Header>
      <Card.Body>
        {/* Main Score Display */}
        <Row className="mb-4 text-center">
          <Col>
            <div
              className="score-circle mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "100px",
                height: "100px",
                background: `conic-gradient(
                  var(--bs-${getLevelColor(scoreData.level)}) ${scoreData.total_score * 3.6}deg,
                  #e9ecef ${scoreData.total_score * 3.6}deg
                )`,
              }}
            >
              <div
                className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "80px", height: "80px" }}
              >
                <div>
                  <h3 className="mb-0">{Math.round(scoreData.total_score)}</h3>
                  <small className="text-muted">/ 100</small>
                </div>
              </div>
            </div>
            <Badge
              bg={getLevelColor(scoreData.level)}
              className="px-3 py-2 fs-6"
            >
              {getLevelIcon(scoreData.level)} {scoreData.level_title}
            </Badge>
            <p className="text-muted small mt-2 mb-0">
              Level {scoreData.level}
            </p>
          </Col>
        </Row>

        {/* Rating Display */}
        {scoreData.total_reviews > 0 && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Reviews</h6>
              <span className="text-warning fs-5">
                {renderStars(scoreData.average_rating)}
              </span>
            </div>
            <div className="text-center mb-3">
              <span className="display-6 text-warning">
                {scoreData.average_rating.toFixed(1)}
              </span>
              <span className="text-muted"> / 5.0</span>
              <p className="text-muted small mb-0">
                Based on {scoreData.total_reviews} review
                {scoreData.total_reviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Star Distribution */}
            {score?.star_distribution && (
              <div className="rating-breakdown">
                {renderRatingBar(
                  5,
                  score.five_star_reviews || 0,
                  score.total_reviews,
                  "success"
                )}
                {renderRatingBar(
                  4,
                  score.four_star_reviews || 0,
                  score.total_reviews,
                  "info"
                )}
                {renderRatingBar(
                  3,
                  score.three_star_reviews || 0,
                  score.total_reviews,
                  "primary"
                )}
                {renderRatingBar(
                  2,
                  score.two_star_reviews || 0,
                  score.total_reviews,
                  "warning"
                )}
                {renderRatingBar(
                  1,
                  score.one_star_reviews || 0,
                  score.total_reviews,
                  "danger"
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <Row className="g-2">
          <Col xs={6}>
            <Card className="bg-light border-0 text-center py-2">
              <h4 className="mb-0 text-primary">
                {scoreData.total_projects_completed || 0}
              </h4>
              <small className="text-muted">Projects Done</small>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="bg-light border-0 text-center py-2">
              <h4 className="mb-0 text-success">
                {score?.on_time_deliveries || 0}
              </h4>
              <small className="text-muted">On-Time</small>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="bg-light border-0 text-center py-2">
              <h4 className="mb-0 text-info">
                {score?.assessments_passed || 0}
              </h4>
              <small className="text-muted">Assessments</small>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="bg-light border-0 text-center py-2">
              <h4 className="mb-0 text-warning">
                {score?.repeat_clients || 0}
              </h4>
              <small className="text-muted">Repeat Clients</small>
            </Card>
          </Col>
        </Row>

        {/* Score Breakdown */}
        {score && (
          <div className="mt-4">
            <h6 className="mb-3">Score Breakdown</h6>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Reviews (40%)</small>
                <small>{Math.round(score.review_score || 0)}</small>
              </div>
              <ProgressBar
                now={score.review_score || 0}
                variant="success"
                style={{ height: "6px" }}
              />
            </div>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Assessments (25%)</small>
                <small>{Math.round(score.assessment_score || 0)}</small>
              </div>
              <ProgressBar
                now={score.assessment_score || 0}
                variant="info"
                style={{ height: "6px" }}
              />
            </div>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Completions (20%)</small>
                <small>{Math.round(score.completion_score || 0)}</small>
              </div>
              <ProgressBar
                now={score.completion_score || 0}
                variant="primary"
                style={{ height: "6px" }}
              />
            </div>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Reliability (15%)</small>
                <small>{Math.round(score.reliability_score || 0)}</small>
              </div>
              <ProgressBar
                now={score.reliability_score || 0}
                variant="warning"
                style={{ height: "6px" }}
              />
            </div>
          </div>
        )}

        {/* Category Ratings from Review Summary */}
        {reviewSummary?.category_ratings && (
          <div className="mt-4">
            <h6 className="mb-3">Rating Categories</h6>
            {Object.entries(reviewSummary.category_ratings).map(
              ([category, rating]) =>
                rating > 0 && (
                  <div key={category} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-capitalize">{category}</small>
                      <small className="text-warning">
                        {rating.toFixed(1)} ★
                      </small>
                    </div>
                    <ProgressBar
                      now={(rating / 5) * 100}
                      variant="warning"
                      style={{ height: "6px" }}
                    />
                  </div>
                )
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProviderScoreDisplay;
