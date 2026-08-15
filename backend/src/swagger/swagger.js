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
      '/api/public/projects': {
        get: {
          tags: ['Public'],
          summary: 'Get public projects (supports search, category, technology, status filters)',
          parameters: [
            { in: 'query', name: 'search', required: false, schema: { type: 'string' } },
            { in: 'query', name: 'category', required: false, schema: { type: 'string' } },
            { in: 'query', name: 'technology', required: false, schema: { type: 'string' } },
            { in: 'query', name: 'status', required: false, schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'List of projects' } }
        }
      },
      '/api/public/projects/slug/{slug}': {
        get: {
          tags: ['Public'],
          summary: 'Get public project by slug with related projects',
          parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Project found with related' }, 404: { description: 'Not found' } }
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
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset link',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Reset link sent (if email exists)' } }
        }
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with token',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, password: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Password updated' } }
        }
      },
      '/api/media': {
        get: {
          tags: ['Media'],
          summary: 'List media files (search/filter/paginate)',
          responses: { 200: { description: 'Media files list' } }
        }
      },
      '/api/media/{id}': {
        put: {
          tags: ['Media'],
          summary: 'Update media file (altText, folder)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated file' } }
        },
        delete: {
          tags: ['Media'],
          summary: 'Delete media file',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'File deleted' } }
        }
      },
      '/api/contact/{id}/lead': {
        put: {
          tags: ['Contact'],
          summary: 'Update lead (status, notes, assignee)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated lead' } }
        }
      },
      '/api/roles': {
        get: {
          tags: ['RBAC'],
          summary: 'List roles with permissions',
          responses: { 200: { description: 'Roles list' } }
        },
        post: {
          tags: ['RBAC'],
          summary: 'Create custom role',
          responses: { 201: { description: 'Role created' } }
        }
      },
      '/api/roles/permissions': {
        get: {
          tags: ['RBAC'],
          summary: 'List all permissions',
          responses: { 200: { description: 'Permissions list' } }
        }
      },
      '/api/roles/{roleId}/permissions': {
        put: {
          tags: ['RBAC'],
          summary: 'Assign permissions to role',
          parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Role updated' } }
        }
      },
      '/api/roles/{roleId}': {
        put: {
          tags: ['RBAC'],
          summary: 'Update role description',
          parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Role updated' } }
        },
        delete: {
          tags: ['RBAC'],
          summary: 'Delete custom role',
          parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Role deleted' } }
        }
      },
      '/api/users/{id}/role': {
        put: {
          tags: ['Users'],
          summary: 'Assign role to user',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { roleId: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'User updated' } }
        }
      },
      '/api/audit': {
        get: {
          tags: ['System'],
          summary: 'List audit logs (filters, pagination)',
          responses: { 200: { description: 'Audit logs' } }
        }
      },
      '/api/notifications': {
        get: {
          tags: ['System'],
          summary: 'List my notifications',
          responses: { 200: { description: 'Notifications' } }
        }
      },
      '/api/notifications/read-all': {
        put: {
          tags: ['System'],
          summary: 'Mark all notifications as read',
          responses: { 200: { description: 'All marked read' } }
        }
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['System'],
          summary: 'Mark notification as read',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Marked read' } }
        }
      },
      '/api/stats/corporate': {
        get: {
          tags: ['Stats'],
          summary: 'Corporate dashboard KPIs',
          responses: { 200: { description: 'Corporate stats' } }
        }
      },
      '/api/posts': {
        get: {
          tags: ['Posts'],
          summary: 'List posts (admin)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'tag', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Posts list' } }
        },
        post: {
          tags: ['Posts'],
          summary: 'Create post',
          responses: { 201: { description: 'Post created' } }
        }
      },
      '/api/posts/slug/{slug}': {
        get: {
          tags: ['Posts'],
          summary: 'Get post by slug',
          parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post' } }
        }
      },
      '/api/posts/{id}': {
        get: {
          tags: ['Posts'],
          summary: 'Get post by id',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post' } }
        },
        put: {
          tags: ['Posts'],
          summary: 'Update post',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post updated' } }
        },
        delete: {
          tags: ['Posts'],
          summary: 'Soft delete post',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post deleted' } }
        }
      },
      '/api/posts/{id}/publish': {
        put: {
          tags: ['Posts'],
          summary: 'Publish post',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post published' } }
        }
      },
      '/api/posts/categories': {
        get: {
          tags: ['Posts'],
          summary: 'List post categories',
          responses: { 200: { description: 'Categories' } }
        },
        post: {
          tags: ['Posts'],
          summary: 'Create category',
          responses: { 201: { description: 'Category created' } }
        }
      },
      '/api/posts/tags': {
        get: {
          tags: ['Posts'],
          summary: 'List post tags',
          responses: { 200: { description: 'Tags' } }
        },
        post: {
          tags: ['Posts'],
          summary: 'Create tag',
          responses: { 201: { description: 'Tag created' } }
        }
      },
      '/api/public/blog': {
        get: {
          tags: ['Public'],
          summary: 'Public blog posts (published)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'tag', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Published posts' } }
        }
      },
      '/api/public/blog/slug/{slug}': {
        get: {
          tags: ['Public'],
          summary: 'Public post detail + related',
          parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post + related' } }
        }
      },
      '/api/public/seo': {
        get: {
          tags: ['Public'],
          summary: 'SEO metadata for a page path',
          parameters: [{ in: 'query', name: 'path', schema: { type: 'string' } }],
          responses: { 200: { description: 'SEO info' } }
        }
      },
      '/api/public/sitemap': {
        get: {
          tags: ['Public'],
          summary: 'XML sitemap',
          responses: { 200: { description: 'sitemap.xml' } }
        }
      },
      '/api/public/robots': {
        get: {
          tags: ['Public'],
          summary: 'robots.txt content',
          responses: { 200: { description: 'robots.txt' } }
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
