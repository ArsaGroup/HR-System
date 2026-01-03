import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import { projectsAPI } from '../../services/api';

const WorkDelivery = ({ projectId }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    files: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      if (formData.files) {
        formDataToSend.append('file', formData.files);
      }
      
      // This would call a work delivery API endpoint
      // await workDeliveryAPI.submitWork(projectId, formDataToSend);
      
      alert('Work submitted successfully!');
      setFormData({ title: '', description: '', files: null });
    } catch (error) {
      console.error('Error submitting work:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <h5>Submit Work</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Attachment</Form.Label>
              <Form.Control
                type="file"
                name="files"
                onChange={handleChange}
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Work'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5>Delivery History</h5>
        </Card.Header>
        <Card.Body>
          {deliveries.length === 0 ? (
            <Alert variant="info">No work deliveries yet.</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(delivery => (
                  <tr key={delivery.id}>
                    <td>{delivery.title}</td>
                    <td>{new Date(delivery.created_at).toLocaleString()}</td>
                    <td>
                      <Badge bg={delivery.status === 'approved' ? 'success' : 'warning'}>
                        {delivery.status}
                      </Badge>
                    </td>
                    <td>
                      <Button size="sm" variant="outline-primary">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default WorkDelivery;

