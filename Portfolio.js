import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Modal, Image } from 'react-bootstrap';
import { portfolioAPI } from '../services/api';

function Portfolio() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    item_type: 'image',
    project_date: '',
    client_name: '',
    project_duration: '',
    external_link: '',
    video_url: '',
    is_public: true,
    is_featured: false
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  const fetchPortfolioItems = async () => {
    try {
      const response = await portfolioAPI.getPortfolioItems();
      setPortfolioItems(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load portfolio items');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    
    // Append all form fields
    Object.keys(newItem).forEach(key => {
      formData.append(key, newItem[key]);
    });

    // Append file if selected
    if (selectedFile) {
      if (newItem.item_type === 'image') {
        formData.append('image_file', selectedFile);
      } else if (newItem.item_type === 'pdf') {
        formData.append('pdf_file', selectedFile);
      }
    }

    // Append external link or video URL if applicable
    if (newItem.item_type === 'link' && newItem.external_link) {
      formData.append('external_link', newItem.external_link);
    }
    if (newItem.item_type === 'video' && newItem.video_url) {
      formData.append('video_url', newItem.video_url);
    }

    try {
      await portfolioAPI.createPortfolioItem(formData);
      setMessage('Portfolio item added successfully!');
      setShowAddModal(false);
      setNewItem({
        title: '',
        description: '',
        item_type: 'image',
        project_date: '',
        client_name: '',
        project_duration: '',
        external_link: '',
        video_url: '',
        is_public: true,
        is_featured: false
      });
      setSelectedFile(null);
      fetchPortfolioItems();
    } catch (err) {
      setError('Failed to add portfolio item');
    }
    
    setLoading(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        await portfolioAPI.deletePortfolioItem(itemId);
        setMessage('Portfolio item deleted successfully!');
        fetchPortfolioItems();
      } catch (err) {
        setError('Failed to delete portfolio item');
      }
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const getItemTypeBadge = (type) => {
    const variants = {
      image: 'primary',
      pdf: 'danger',
      link: 'info',
      video: 'warning'
    };
    return variants[type] || 'secondary';
  };

  const renderItemPreview = (item) => {
    switch (item.item_type) {
      case 'image':
        return item.image_file ? (
          <Image src={item.image_file} fluid className="w-100" style={{height: '200px', objectFit: 'cover'}} />
        ) : (
          <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '200px'}}>
            <span className="text-muted">No Image</span>
          </div>
        );
      case 'pdf':
        return (
          <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '200px'}}>
            <span className="text-muted">📄 PDF Document</span>
          </div>
        );
      case 'link':
        return (
          <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '200px'}}>
            <span className="text-muted">🔗 External Link</span>
          </div>
        );
      case 'video':
        return (
          <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '200px'}}>
            <span className="text-muted">🎥 Video</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Portfolio Management</h1>
              <p className="lead">Showcase your best work and projects</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowAddModal(true)}
            >
              + Add Portfolio Item
            </Button>
          </div>
        </Col>
      </Row>

      {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Row>
        {portfolioItems.length === 0 ? (
          <Col>
            <Card>
              <Card.Body className="text-center py-5">
                <div className="display-1 text-muted mb-3">💼</div>
                <h4>No Portfolio Items Yet</h4>
                <p className="text-muted">
                  Start building your portfolio by adding your best work and projects.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setShowAddModal(true)}
                >
                  Add Your First Portfolio Item
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          portfolioItems.map((item) => (
            <Col lg={4} md={6} key={item.id} className="mb-4">
              <Card className="h-100">
                {renderItemPreview(item)}
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h6 mb-0">{item.title}</Card.Title>
                    <Badge bg={getItemTypeBadge(item.item_type)}>
                      {item.item_type}
                    </Badge>
                  </div>
                  
                  <Card.Text className="small text-muted">
                    {item.description?.substring(0, 100)}...
                  </Card.Text>

                  <div className="mt-auto">
                    {item.client_name && (
                      <small className="d-block text-muted">
                        Client: {item.client_name}
                      </small>
                    )}
                    {item.project_date && (
                      <small className="d-block text-muted">
                        Date: {new Date(item.project_date).toLocaleDateString()}
                      </small>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div>
                        {item.is_featured && (
                          <Badge bg="warning" className="me-1">Featured</Badge>
                        )}
                        {item.is_public ? (
                          <Badge bg="success">Public</Badge>
                        ) : (
                          <Badge bg="secondary">Private</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Add Portfolio Item Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Portfolio Item</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddItem}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    required
                    placeholder="Project title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Type *</Form.Label>
                  <Form.Select
                    value={newItem.item_type}
                    onChange={(e) => setNewItem({...newItem, item_type: e.target.value})}
                    required
                  >
                    <option value="image">Image</option>
                    <option value="pdf">PDF Document</option>
                    <option value="link">External Link</option>
                    <option value="video">Video</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Describe your project..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newItem.project_date}
                    onChange={(e) => setNewItem({...newItem, project_date: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Duration</Form.Label>
                  <Form.Control
                    type="text"
                    value={newItem.project_duration}
                    onChange={(e) => setNewItem({...newItem, project_duration: e.target.value})}
                    placeholder="e.g., 2 weeks, 1 month"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Client Name</Form.Label>
              <Form.Control
                type="text"
                value={newItem.client_name}
                onChange={(e) => setNewItem({...newItem, client_name: e.target.value})}
                placeholder="Client or organization name"
              />
            </Form.Group>

            {(newItem.item_type === 'image' || newItem.item_type === 'pdf') && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Upload {newItem.item_type === 'image' ? 'Image' : 'PDF'} *
                </Form.Label>
                <Form.Control
                  type="file"
                  accept={newItem.item_type === 'image' ? 'image/*' : '.pdf'}
                  onChange={handleFileChange}
                  required
                />
              </Form.Group>
            )}

            {newItem.item_type === 'link' && (
              <Form.Group className="mb-3">
                <Form.Label>External Link *</Form.Label>
                <Form.Control
                  type="url"
                  value={newItem.external_link}
                  onChange={(e) => setNewItem({...newItem, external_link: e.target.value})}
                  placeholder="https://example.com"
                  required
                />
              </Form.Group>
            )}

            {newItem.item_type === 'video' && (
              <Form.Group className="mb-3">
                <Form.Label>Video URL *</Form.Label>
                <Form.Control
                  type="url"
                  value={newItem.video_url}
                  onChange={(e) => setNewItem({...newItem, video_url: e.target.value})}
                  placeholder="https://youtube.com/..."
                  required
                />
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Make this item public"
                    checked={newItem.is_public}
                    onChange={(e) => setNewItem({...newItem, is_public: e.target.checked})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Feature this item"
                    checked={newItem.is_featured}
                    onChange={(e) => setNewItem({...newItem, is_featured: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Portfolio;