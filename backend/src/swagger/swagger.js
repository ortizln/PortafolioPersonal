const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio API',
      version: '1.0.0',
      description: 'Professional Portfolio Management API'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Invalid input' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/api/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Token refreshed successfully' },
            401: { description: 'Invalid refresh token' }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Current user data' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Check API health status',
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/company': {
        get: {
          tags: ['Company'],
          summary: 'Get company info',
          responses: { 200: { description: 'Company info' } }
        },
        put: {
          tags: ['Company'],
          summary: 'Create or update company info (singleton)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Company saved' } }
        },
        delete: {
          tags: ['Company'],
          summary: 'Delete company info',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Company deleted' } }
        }
      },
      '/api/services': {
        get: {
          tags: ['Services'],
          summary: 'List services',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of services' } }
        },
        post: {
          tags: ['Services'],
          summary: 'Create a service',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Service created' } }
        }
      },
      '/api/services/{id}': {
        get: {
          tags: ['Services'],
          summary: 'Get service by id',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Service found' }, 404: { description: 'Not found' } }
        },
        put: {
          tags: ['Services'],
          summary: 'Update service',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Service updated' } }
        },
        delete: {
          tags: ['Services'],
          summary: 'Soft delete service',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Service deleted' } }
        }
      },
      '/api/clients': {
        get: {
          tags: ['Clients'],
          summary: 'List clients',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of clients' } }
        },
        post: {
          tags: ['Clients'],
          summary: 'Create a client',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Client created' } }
        }
      },
      '/api/clients/{id}': {
        get: {
          tags: ['Clients'],
          summary: 'Get client by id',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Client found' }, 404: { description: 'Not found' } }
        },
        put: {
          tags: ['Clients'],
          summary: 'Update client',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Client updated' } }
        },
        delete: {
          tags: ['Clients'],
          summary: 'Soft delete client',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Client deleted' } }
        }
      },
      '/api/testimonials': {
        get: {
          tags: ['Testimonials'],
          summary: 'List testimonials',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of testimonials' } }
        },
        post: {
          tags: ['Testimonials'],
          summary: 'Create a testimonial',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Testimonial created' } }
        }
      },
      '/api/testimonials/{id}': {
        get: {
          tags: ['Testimonials'],
          summary: 'Get testimonial by id',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Testimonial found' }, 404: { description: 'Not found' } }
        },
        put: {
          tags: ['Testimonials'],
          summary: 'Update testimonial',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Testimonial updated' } }
        },
        delete: {
          tags: ['Testimonials'],
          summary: 'Soft delete testimonial',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Testimonial deleted' } }
        }
      },
      '/api/team': {
        get: {
          tags: ['Team'],
          summary: 'List team members',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of team members' } }
        },
        post: {
          tags: ['Team'],
          summary: 'Create a team member',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Team member created' } }
        }
      },
      '/api/team/{id}': {
        get: {
          tags: ['Team'],
          summary: 'Get team member by id with full profile',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team member found' }, 404: { description: 'Not found' } }
        },
        put: {
          tags: ['Team'],
          summary: 'Update team member',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team member updated' } }
        },
        delete: {
          tags: ['Team'],
          summary: 'Soft delete team member',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team member deleted' } }
        }
      },
      '/api/public/team': {
        get: {
          tags: ['Public'],
          summary: 'Get public team members',
          responses: { 200: { description: 'List of team members' } }
        }
      },
      '/api/public/team/{slug}': {
        get: {
          tags: ['Public'],
          summary: 'Get public team member by slug with full profile',
          parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team member found' }, 404: { description: 'Not found' } }
        }
      },
      '/api/public/company': {
        get: {
          tags: ['Public'],
          summary: 'Get active company info (public)',
          responses: { 200: { description: 'Company info' } }
        }
      },
      '/api/public/services': {
        get: {
          tags: ['Public'],
          summary: 'Get active services (public)',
          responses: { 200: { description: 'List of services' } }
        }
      },
      '/api/public/clients': {
        get: {
          tags: ['Public'],
          summary: 'Get public clients',
          responses: { 200: { description: 'List of clients' } }
        }
      },
      '/api/public/testimonials': {
        get: {
          tags: ['Public'],
          summary: 'Get published testimonials',
          responses: { 200: { description: 'List of testimonials' } }
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
