/**
 * Unit tests for ZohoDesk node
 */

import { ZohoDesk } from '../../nodes/ZohoDesk/ZohoDesk.node';
import {
  createMockExecuteFunctions,
  createMockLoadOptionsFunctions,
  createMockTicket,
  createMockContact,
  createMockAccount,
  createMockListResponse,
  createMockDepartment,
  createMockTeam,
  createMockHttpError,
  mockCredentials,
} from './mocks/n8n.mock';

describe('ZohoDesk Node', () => {
  let node: ZohoDesk;

  beforeEach(() => {
    node = new ZohoDesk();
    jest.clearAllMocks();
  });

  describe('description', () => {
    it('should have correct metadata', () => {
      expect(node.description.displayName).toBe('Zoho Desk');
      expect(node.description.name).toBe('zohoDesk');
      expect(node.description.group).toContain('transform');
    });
  });

  describe('Ticket Operations', () => {
    describe('create', () => {
      it('should create a ticket with required fields', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: 'Test description',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '',
            contact: { contactValues: {} },
            additionalFields: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'POST',
            uri: expect.stringContaining('/tickets'),
          }),
        );
        expect(result[0][0].json).toEqual(mockResponse);
      });

      it('should create a ticket with contact email', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '',
            contact: {
              contactValues: {
                email: 'test@example.com',
                lastName: 'Doe',
              },
            },
            additionalFields: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            body: expect.objectContaining({
              contact: expect.objectContaining({
                email: 'test@example.com',
                lastName: 'Doe',
              }),
            }),
          }),
        );
      });

      it('should throw error for invalid email format', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '',
            contact: {
              contactValues: {
                email: 'invalid-email',
              },
            },
            additionalFields: {},
          },
        });

        await expect(node.execute.call(mockFunctions)).rejects.toThrow(/email/i);
      });

      it('should handle custom fields as JSON', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '',
            contact: { contactValues: {} },
            additionalFields: {
              cf: '{"cf_custom_field": "value"}',
            },
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            body: expect.objectContaining({
              cf: { cf_custom_field: 'value' },
            }),
          }),
        );
      });

      it('should throw error for invalid custom fields JSON', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '',
            contact: { contactValues: {} },
            additionalFields: {
              cf: 'invalid json',
            },
          },
        });

        await expect(node.execute.call(mockFunctions)).rejects.toThrow(/JSON/i);
      });

      it('should throw error for custom fields as array', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '',
            contact: { contactValues: {} },
            additionalFields: {
              cf: '[1, 2, 3]',
            },
          },
        });

        await expect(node.execute.call(mockFunctions)).rejects.toThrow(/object/i);
      });

      it('should handle dueDate conversion', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: '2025-12-25T10:00:00Z',
            contact: { contactValues: {} },
            additionalFields: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            body: expect.objectContaining({
              dueDate: '2025-12-25T10:00:00.000Z',
            }),
          }),
        );
      });

      it('should throw error for invalid dueDate', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'create',
            departmentId: '9876543210987654321',
            teamId: '',
            subject: 'Test Ticket',
            description: '',
            priority: 'Medium',
            classification: 'Question',
            dueDate: 'invalid-date',
            contact: { contactValues: {} },
            additionalFields: {},
          },
        });

        await expect(node.execute.call(mockFunctions)).rejects.toThrow(/date/i);
      });
    });

    describe('get', () => {
      it('should get a ticket by ID', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'get',
            ticketId: '1234567890123456789',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'GET',
            uri: expect.stringContaining('/tickets/1234567890123456789'),
          }),
        );
        expect(result[0][0].json).toEqual(mockResponse);
      });

      it('should throw error for invalid ticket ID', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'get',
            ticketId: '123', // Too short
          },
        });

        await expect(node.execute.call(mockFunctions)).rejects.toThrow(/ticket/i);
      });

      it('should allow n8n expressions in ticket ID', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'get',
            ticketId: '{{$json.ticketId}}',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        // Should not throw for n8n expression
        await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalled();
      });
    });

    describe('list', () => {
      it('should list active tickets by default', async () => {
        const mockTickets = [createMockTicket({ id: '1' }), createMockTicket({ id: '2' })];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'list',
            ticketType: 'active',
            returnAll: false,
            limit: 10,
            filters: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse(mockTickets),
        );

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'GET',
            uri: expect.stringContaining('/tickets'),
          }),
        );
        expect(result[0]).toHaveLength(2);
      });

      it('should list archived tickets when ticketType is archived', async () => {
        const mockTickets = [createMockTicket({ id: '1' }), createMockTicket({ id: '2' })];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'list',
            ticketType: 'archived',
            returnAll: false,
            limit: 10,
            filters: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse(mockTickets),
        );

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'GET',
            uri: expect.stringContaining('/archivedTickets'),
          }),
        );
        expect(result[0]).toHaveLength(2);
      });

      it('should list both active and archived tickets when ticketType is all', async () => {
        const activeTickets = [createMockTicket({ id: '1' })];
        const archivedTickets = [createMockTicket({ id: '2' })];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'list',
            ticketType: 'all',
            returnAll: false,
            limit: 10,
            filters: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock)
          .mockResolvedValueOnce(createMockListResponse(activeTickets))
          .mockResolvedValueOnce(createMockListResponse(archivedTickets));

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledTimes(2);
        expect(result[0]).toHaveLength(2);
        // Check _source field is added
        expect(result[0][0].json._source).toBe('active');
        expect(result[0][1].json._source).toBe('archived');
      });

      it('should fetch all tickets when returnAll is true', async () => {
        const page1 = [createMockTicket({ id: '1' }), createMockTicket({ id: '2' })];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'list',
            ticketType: 'active',
            returnAll: true,
            filters: {},
          },
        });

        // The pagination continues until a page returns fewer items than the limit
        (mockFunctions.helpers.requestOAuth2.call as jest.Mock)
          .mockResolvedValueOnce(createMockListResponse(page1))
          .mockResolvedValueOnce(createMockListResponse([]));

        const result = await node.execute.call(mockFunctions);

        expect(result[0]).toHaveLength(2);
      });
    });

    describe('update', () => {
      it('should update a ticket', async () => {
        const mockResponse = createMockTicket({ subject: 'Updated Subject' });
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'update',
            ticketId: '1234567890123456789',
            description: 'Updated description',
            updateFields: {
              subject: 'Updated Subject',
              priority: '',
              classification: '',
              dueDate: '',
            },
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'PATCH',
            uri: expect.stringContaining('/tickets/1234567890123456789'),
          }),
        );
        expect(result[0][0].json.subject).toBe('Updated Subject');
      });

      it('should handle "No Change" (empty string) values for optional fields', async () => {
        const mockResponse = createMockTicket();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'update',
            ticketId: '1234567890123456789',
            description: '',
            updateFields: {
              priority: '', // "No Change"
              classification: '', // "No Change"
              dueDate: '', // "No Change"
            },
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        await node.execute.call(mockFunctions);

        // The API call should still be made - empty values are filtered or sent based on field type
        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalled();
      });
    });

    describe('delete', () => {
      it('should delete a ticket (move to trash)', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'delete',
            ticketId: '1234567890123456789',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue({});

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'POST',
            uri: expect.stringContaining('/tickets/moveToTrash'),
          }),
        );
        expect(result[0][0].json.success).toBe(true);
      });
    });

    describe('addComment', () => {
      it('should add a comment to a ticket', async () => {
        const mockResponse = { id: 'comment123', content: 'Test comment' };
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'addComment',
            ticketId: '1234567890123456789',
            content: 'Test comment',
            isPublic: true,
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'POST',
            uri: expect.stringContaining('/tickets/1234567890123456789/comments'),
            body: expect.objectContaining({
              content: 'Test comment',
              isPublic: true,
            }),
          }),
        );
        expect(result[0][0].json).toEqual(mockResponse);
      });
    });

    describe('listThreads', () => {
      it('should list ticket threads', async () => {
        const mockThreads = [{ id: 'thread1' }, { id: 'thread2' }];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'ticket',
            operation: 'listThreads',
            ticketId: '1234567890123456789',
            returnAll: false,
            limit: 10,
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse(mockThreads),
        );

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'GET',
            uri: expect.stringContaining('/tickets/1234567890123456789/conversations'),
          }),
        );
        expect(result[0]).toHaveLength(2);
      });
    });
  });

  describe('Contact Operations', () => {
    describe('create', () => {
      it('should create a contact with email', async () => {
        const mockResponse = createMockContact();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'contact',
            operation: 'create',
            email: 'john@example.com',
            lastName: 'Doe',
            additionalFields: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'POST',
            uri: expect.stringContaining('/contacts'),
            body: expect.objectContaining({
              email: 'john@example.com',
              lastName: 'Doe',
            }),
          }),
        );
        expect(result[0][0].json).toEqual(mockResponse);
      });

      it('should throw error for invalid contact email', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'contact',
            operation: 'create',
            email: 'invalid-email',
            lastName: 'Doe',
            additionalFields: {},
          },
        });

        await expect(node.execute.call(mockFunctions)).rejects.toThrow(/email/i);
      });
    });

    describe('get', () => {
      it('should get a contact by ID', async () => {
        const mockResponse = createMockContact();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'contact',
            operation: 'get',
            contactId: '1234567890123456790',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(result[0][0].json).toEqual(mockResponse);
      });
    });

    describe('list', () => {
      it('should list contacts', async () => {
        const mockContacts = [createMockContact({ id: '1' }), createMockContact({ id: '2' })];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'contact',
            operation: 'list',
            returnAll: false,
            limit: 10,
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse(mockContacts),
        );

        const result = await node.execute.call(mockFunctions);

        expect(result[0]).toHaveLength(2);
      });
    });

    describe('update', () => {
      it('should update a contact', async () => {
        const mockResponse = createMockContact({ firstName: 'John' });
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'contact',
            operation: 'update',
            contactId: '1234567890123456790',
            updateFields: {
              firstName: 'John',
            },
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(result[0][0].json.firstName).toBe('John');
      });
    });

    describe('delete', () => {
      it('should delete a contact', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'contact',
            operation: 'delete',
            contactId: '1234567890123456790',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue({});

        const result = await node.execute.call(mockFunctions);

        expect(result[0][0].json.success).toBe(true);
      });
    });
  });

  describe('Account Operations', () => {
    describe('create', () => {
      it('should create an account', async () => {
        const mockResponse = createMockAccount();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'account',
            operation: 'create',
            accountName: 'Test Company',
            additionalFields: {},
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            method: 'POST',
            uri: expect.stringContaining('/accounts'),
          }),
        );
        expect(result[0][0].json).toEqual(mockResponse);
      });
    });

    describe('get', () => {
      it('should get an account by ID', async () => {
        const mockResponse = createMockAccount();
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'account',
            operation: 'get',
            accountId: '1234567890123456791',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(result[0][0].json).toEqual(mockResponse);
      });
    });

    describe('list', () => {
      it('should list accounts', async () => {
        const mockAccounts = [createMockAccount({ id: '1' }), createMockAccount({ id: '2' })];
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'account',
            operation: 'list',
            returnAll: false,
            limit: 10,
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse(mockAccounts),
        );

        const result = await node.execute.call(mockFunctions);

        expect(result[0]).toHaveLength(2);
      });
    });

    describe('update', () => {
      it('should update an account', async () => {
        const mockResponse = createMockAccount({ accountName: 'Updated Company' });
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'account',
            operation: 'update',
            accountId: '1234567890123456791',
            updateFields: {
              accountName: 'Updated Company',
            },
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(mockResponse);

        const result = await node.execute.call(mockFunctions);

        expect(result[0][0].json.accountName).toBe('Updated Company');
      });
    });

    describe('delete', () => {
      it('should delete an account', async () => {
        const mockFunctions = createMockExecuteFunctions({
          nodeParameters: {
            resource: 'account',
            operation: 'delete',
            accountId: '1234567890123456791',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue({});

        const result = await node.execute.call(mockFunctions);

        expect(result[0][0].json.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors with continueOnFail=false', async () => {
      const mockFunctions = createMockExecuteFunctions({
        nodeParameters: {
          resource: 'ticket',
          operation: 'get',
          ticketId: '1234567890123456789',
        },
        continueOnFail: false,
      });

      const apiError = new Error('API Error');
      (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(apiError);

      await expect(node.execute.call(mockFunctions)).rejects.toThrow('API Error');
    });

    it('should return error object with continueOnFail=true', async () => {
      const mockFunctions = createMockExecuteFunctions({
        nodeParameters: {
          resource: 'ticket',
          operation: 'get',
          ticketId: '1234567890123456789',
        },
        continueOnFail: true,
      });

      const apiError = new Error('API Error');
      (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(apiError);

      const result = await node.execute.call(mockFunctions);

      expect(result[0][0].json.error).toBeDefined();
    });

    it('should detect rate limiting (HTTP 429)', async () => {
      const mockFunctions = createMockExecuteFunctions({
        nodeParameters: {
          resource: 'ticket',
          operation: 'get',
          ticketId: '1234567890123456789',
        },
        continueOnFail: false,
      });

      const rateLimitError = createMockHttpError('Too Many Requests', 429);
      (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(rateLimitError);

      await expect(node.execute.call(mockFunctions)).rejects.toThrow(/rate limit/i);
    });
  });

  describe('Load Options', () => {
    describe('getDepartments', () => {
      it('should load departments list', async () => {
        const mockDepartments = [
          createMockDepartment({ id: '1', name: 'Support' }),
          createMockDepartment({ id: '2', name: 'Sales' }),
        ];
        const mockFunctions = createMockLoadOptionsFunctions();

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse(mockDepartments),
        );

        const result = await node.methods.loadOptions.getDepartments.call(mockFunctions);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ name: 'Support', value: '1' });
        expect(result[1]).toEqual({ name: 'Sales', value: '2' });
      });

      it('should handle empty departments list', async () => {
        const mockFunctions = createMockLoadOptionsFunctions();

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        const result = await node.methods.loadOptions.getDepartments.call(mockFunctions);

        expect(result).toHaveLength(0);
      });

      it('should handle API error in getDepartments', async () => {
        const mockFunctions = createMockLoadOptionsFunctions();

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(
          new Error('API Error'),
        );

        const result = await node.methods.loadOptions.getDepartments.call(mockFunctions);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('Error');
      });
    });

    describe('getTeams', () => {
      it('should load teams for a department', async () => {
        const mockTeams = [
          createMockTeam({ id: '1', name: 'Team A' }),
          createMockTeam({ id: '2', name: 'Team B' }),
        ];
        const mockFunctions = createMockLoadOptionsFunctions({
          currentNodeParameters: {
            departmentId: '9876543210987654321',
          },
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue({
          teams: mockTeams,
        });

        const result = await node.methods.loadOptions.getTeams.call(mockFunctions);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ name: 'Team A', value: '1' });
      });

      it('should return empty array when no department selected', async () => {
        const mockFunctions = createMockLoadOptionsFunctions({
          currentNodeParameters: {
            departmentId: '',
          },
        });

        const result = await node.methods.loadOptions.getTeams.call(mockFunctions);

        expect(result).toHaveLength(0);
      });
    });
  });
});
