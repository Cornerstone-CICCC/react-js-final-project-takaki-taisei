// OpenAPI 3 specification for the Pseudo File System API.
// Served as interactive docs at GET /api/docs and as raw JSON at GET /api/openapi.json.

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  example: 'root',
};

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Pseudo File System API',
    version: '1.0.0',
    description:
      'A virtual file system. Folders and files are **simulated in SQLite** — no real OS ' +
      'files are touched. Text files store an editable `content` string; binary files ' +
      '(PNG, PDF, …) are uploaded and stored as BLOBs, then served via `/nodes/{id}/raw`. ' +
      'All JSON responses are wrapped as `{ "data": ... }`.',
  },
  servers: [{ url: 'http://localhost:4000/api', description: 'Local dev server' }],
  security: [{ cookieAuth: [] }],
  tags: [
    { name: 'System', description: 'Health' },
    { name: 'Tree', description: 'Browse the file system' },
    { name: 'Nodes', description: 'Create / update / move / delete files and folders' },
    { name: 'Files', description: 'Binary upload & raw download' },
    { name: 'Search', description: 'Search by name or text content' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Server is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'pseudo-fs-server' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/tree': {
      get: {
        tags: ['Tree'],
        summary: 'Get the whole tree (nested) from the root folder',
        responses: {
          200: {
            description: 'Nested tree',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/TreeNode' } },
                },
              },
            },
          },
        },
      },
    },

    '/nodes': {
      post: {
        tags: ['Nodes'],
        summary: 'Create a folder or a text file',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateNodeRequest' },
              examples: {
                folder: { summary: 'Folder', value: { name: 'Music', type: 'FOLDER', parentId: 'root' } },
                textFile: { summary: 'Text file', value: { name: 'hello.txt', type: 'FILE', content: 'hi there' } },
              },
            },
          },
        },
        responses: {
          201: { $ref: '#/components/responses/NodeData' },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },

    '/nodes/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload a binary file (PNG, PDF, …) — stored as a BLOB',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'The file to upload (max 10 MB)' },
                  name: { type: 'string', description: 'Optional — defaults to the uploaded filename' },
                  parentId: { type: 'string', default: 'root' },
                },
              },
            },
          },
        },
        responses: {
          201: { $ref: '#/components/responses/NodeData' },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
          413: { $ref: '#/components/responses/PayloadTooLarge' },
        },
      },
    },

    '/nodes/{id}': {
      get: {
        tags: ['Nodes'],
        summary: 'Get a node with breadcrumb path and children',
        parameters: [idParam],
        responses: {
          200: {
            description: 'Node detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/NodeDetail' } },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Nodes'],
        summary: 'Rename a node and/or edit a text file’s content',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateNodeRequest' },
              examples: {
                rename: { summary: 'Rename', value: { name: 'renamed.txt' } },
                editContent: { summary: 'Edit content', value: { content: 'new body' } },
              },
            },
          },
        },
        responses: {
          200: { $ref: '#/components/responses/NodeData' },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
      delete: {
        tags: ['Nodes'],
        summary: 'Delete a node (folders cascade-delete their subtree)',
        parameters: [idParam],
        responses: {
          200: {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { id: { type: 'string' }, deleted: { type: 'boolean', example: true } },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/nodes/{id}/raw': {
      get: {
        tags: ['Files'],
        summary: 'Stream the raw file bytes/text with the correct Content-Type',
        description: 'Use this URL directly in `<img src>` or `<iframe src>`.',
        parameters: [idParam],
        responses: {
          200: {
            description: 'Raw content (Content-Type matches the file)',
            content: {
              'image/png': { schema: { type: 'string', format: 'binary' } },
              'application/pdf': { schema: { type: 'string', format: 'binary' } },
              'application/octet-stream': { schema: { type: 'string', format: 'binary' } },
              'text/plain': { schema: { type: 'string' } },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/nodes/{id}/move': {
      post: {
        tags: ['Nodes'],
        summary: 'Move a node into another folder',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MoveNodeRequest' },
            },
          },
        },
        responses: {
          200: { $ref: '#/components/responses/NodeData' },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },

    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Search nodes by name or text content',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, example: 'todo' },
        ],
        responses: {
          200: {
            description: 'Matches with their full path',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/SearchResult' } },
                    count: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token',
      },
    },
    schemas: {
      Node: {
        type: 'object',
        description:
          'A file or folder. File-only fields (isBinary, mimeType, size, rawUrl) are absent ' +
          'on folders. `content` is present only on text files.',
        required: ['id', 'name', 'type', 'parentId', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: 'cmq68ew4y0001t6o1g4f9fkof' },
          name: { type: 'string', example: 'notes.md' },
          type: { type: 'string', enum: ['FILE', 'FOLDER'] },
          parentId: { type: 'string', nullable: true, example: 'root' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          isBinary: { type: 'boolean', description: 'Files only — true = uploaded binary, false = editable text' },
          mimeType: { type: 'string', example: 'text/plain; charset=utf-8' },
          size: { type: 'integer', description: 'Byte size of the body', example: 42 },
          rawUrl: { type: 'string', example: '/api/nodes/cmq68ew4y0001t6o1g4f9fkof/raw' },
          content: { type: 'string', description: 'Text files only', example: '# Notes' },
        },
      },
      TreeNode: {
        allOf: [
          { $ref: '#/components/schemas/Node' },
          {
            type: 'object',
            properties: {
              children: {
                type: 'array',
                description: 'Folders only',
                items: { $ref: '#/components/schemas/TreeNode' },
              },
            },
          },
        ],
      },
      Crumb: {
        type: 'object',
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      NodeDetail: {
        allOf: [
          { $ref: '#/components/schemas/Node' },
          {
            type: 'object',
            properties: {
              path: { type: 'array', items: { $ref: '#/components/schemas/Crumb' } },
              children: {
                type: 'array',
                description: 'Folders only',
                items: { $ref: '#/components/schemas/Node' },
              },
            },
          },
        ],
      },
      SearchResult: {
        allOf: [
          { $ref: '#/components/schemas/Node' },
          {
            type: 'object',
            properties: {
              path: { type: 'array', items: { $ref: '#/components/schemas/Crumb' } },
              pathString: { type: 'string', example: '/Documents/todo.md' },
            },
          },
        ],
      },
      CreateNodeRequest: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', example: 'hello.txt' },
          type: { type: 'string', enum: ['FILE', 'FOLDER'] },
          parentId: { type: 'string', default: 'root', example: 'root' },
          content: { type: 'string', description: 'Text files only', example: 'hi there' },
        },
      },
      UpdateNodeRequest: {
        type: 'object',
        minProperties: 1,
        description: 'Provide at least one of `name` / `content`.',
        properties: {
          name: { type: 'string', example: 'renamed.txt' },
          content: { type: 'string', example: 'new body' },
        },
      },
      MoveNodeRequest: {
        type: 'object',
        required: ['parentId'],
        properties: { parentId: { type: 'string', example: 'root' } },
      },
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: { type: 'string', example: 'AppError' },
          message: { type: 'string', example: '"notes.md" already exists in this folder' },
          details: {
            type: 'array',
            description: 'Field-level issues (validation errors only)',
            items: {
              type: 'object',
              properties: { path: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
    },

    responses: {
      NodeData: {
        description: 'The affected node',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { data: { $ref: '#/components/schemas/Node' } },
            },
          },
        },
      },
      BadRequest: {
        description: 'Invalid input or an illegal operation',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Node or route not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'A sibling with the same name already exists',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      PayloadTooLarge: {
        description: 'Uploaded file exceeds the 10 MB limit',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};
