/**
 * Unit tests for ZohoDeskTrigger node
 */

import { ZohoDeskTrigger } from '../../nodes/ZohoDesk/ZohoDeskTrigger.node';
import {
  createMockPollFunctions,
  createMockLoadOptionsFunctions,
  createMockTicket,
  createMockContact,
  createMockAccount,
  createMockListResponse,
  createMockDepartment,
} from './mocks/n8n.mock';

describe('ZohoDeskTrigger Node', () => {
  let node: ZohoDeskTrigger;

  beforeEach(() => {
    node = new ZohoDeskTrigger();
    jest.clearAllMocks();
  });

  describe('description', () => {
    it('should have correct metadata', () => {
      expect(node.description.displayName).toBe('Zoho Desk Trigger');
      expect(node.description.name).toBe('zohoDeskTrigger');
      expect(node.description.group).toContain('trigger');
      expect(node.description.polling).toBe(true);
    });

    it('should have all event types', () => {
      const eventProperty = node.description.properties.find((p) => p.name === 'event');
      expect(eventProperty).toBeDefined();
      expect(eventProperty?.options).toHaveLength(6);

      const eventValues = (eventProperty?.options as Array<{ value: string }>).map((o) => o.value);
      expect(eventValues).toContain('newTicket');
      expect(eventValues).toContain('ticketUpdated');
      expect(eventValues).toContain('newContact');
      expect(eventValues).toContain('contactUpdated');
      expect(eventValues).toContain('newAccount');
      expect(eventValues).toContain('accountUpdated');
    });
  });

  describe('poll()', () => {
    describe('First Run', () => {
      it('should initialize state on first run with no items', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        const result = await node.poll.call(mockFunctions);

        expect(result).toBeNull();
        expect(staticData.lastPollTime).toBeDefined();
        expect(staticData.lastSeenIds).toEqual([]);
      });

      it('should return items created in last minute on first run', async () => {
        const staticData: Record<string, unknown> = {};
        const recentTicket = createMockTicket({
          id: '1',
          createdTime: new Date().toISOString(),
        });
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([recentTicket]),
        );

        const result = await node.poll.call(mockFunctions);

        expect(result).not.toBeNull();
        expect(result![0]).toHaveLength(1);
        expect(result![0][0].json.id).toBe('1');
      });

      it('should handle API error on first run gracefully', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(
          new Error('API Error'),
        );

        const result = await node.poll.call(mockFunctions);

        // On first run, errors are swallowed and state is initialized
        expect(result).toBeNull();
        expect(staticData.lastPollTime).toBeDefined();
        expect(staticData.lastSeenIds).toEqual([]);
      });
    });

    describe('Subsequent Runs', () => {
      it('should return new tickets since last poll', async () => {
        const lastPollTime = Date.now() - 60000; // 1 minute ago
        const staticData: Record<string, unknown> = {
          lastPollTime,
          lastSeenIds: [],
        };
        const newTicket = createMockTicket({
          id: '1',
          createdTime: new Date().toISOString(),
        });
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([newTicket]),
        );

        const result = await node.poll.call(mockFunctions);

        expect(result).not.toBeNull();
        expect(result![0]).toHaveLength(1);
      });

      it('should skip already seen items', async () => {
        const lastPollTime = Date.now() - 60000;
        const staticData: Record<string, unknown> = {
          lastPollTime,
          lastSeenIds: ['1'], // Already seen this ticket
        };
        const ticket = createMockTicket({
          id: '1',
          createdTime: new Date().toISOString(),
        });
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([ticket]),
        );

        const result = await node.poll.call(mockFunctions);

        // Should return null because the only item was already seen
        expect(result).toBeNull();
      });

      it('should update lastSeenIds with new items', async () => {
        const lastPollTime = Date.now() - 60000;
        const staticData: Record<string, unknown> = {
          lastPollTime,
          lastSeenIds: [],
        };
        const newTicket = createMockTicket({
          id: 'new-ticket-id',
          createdTime: new Date().toISOString(),
        });
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([newTicket]),
        );

        await node.poll.call(mockFunctions);

        expect(staticData.lastSeenIds).toContain('new-ticket-id');
      });

      it('should throw error on API failure after first run', async () => {
        const lastPollTime = Date.now() - 60000;
        const staticData: Record<string, unknown> = {
          lastPollTime,
          lastSeenIds: [],
        };
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(
          new Error('API Error'),
        );

        await expect(node.poll.call(mockFunctions)).rejects.toThrow('API Error');
      });
    });

    describe('Event Types', () => {
      it('should use correct endpoint for newTicket', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('/tickets'),
          }),
        );
      });

      it('should use correct endpoint for ticketUpdated', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'ticketUpdated',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringMatching(/\/tickets.*modifiedTimeRange/),
          }),
        );
      });

      it('should use correct endpoint for newContact', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newContact',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('/contacts'),
          }),
        );
      });

      it('should use correct endpoint for contactUpdated', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'contactUpdated',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringMatching(/\/contacts.*modifiedTimeRange/),
          }),
        );
      });

      it('should use correct endpoint for newAccount', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newAccount',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('/accounts'),
          }),
        );
      });

      it('should use correct endpoint for accountUpdated', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'accountUpdated',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringMatching(/\/accounts.*modifiedTimeRange/),
          }),
        );
      });
    });

    describe('Department Filtering', () => {
      it('should add departmentId filter for ticket events', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '9876543210987654321',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('departmentId=9876543210987654321'),
          }),
        );
      });

      it('should not add departmentId filter when empty', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 50 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.not.stringContaining('departmentId='),
          }),
        );
      });
    });

    describe('Include Options', () => {
      it('should add include parameter for ticket events', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: {
              limit: 50,
              include: ['contacts', 'assignee'],
            },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('include=contacts%2Cassignee'),
          }),
        );
      });
    });

    describe('Limit Option', () => {
      it('should use provided limit', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: { limit: 25 },
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('limit=25'),
          }),
        );
      });

      it('should use default limit of 50 when not specified', async () => {
        const staticData: Record<string, unknown> = {};
        const mockFunctions = createMockPollFunctions({
          nodeParameters: {
            event: 'newTicket',
            departmentId: '',
            options: {},
          },
          workflowStaticData: staticData,
        });

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue(
          createMockListResponse([]),
        );

        await node.poll.call(mockFunctions);

        expect(mockFunctions.helpers.requestOAuth2.call).toHaveBeenCalledWith(
          mockFunctions,
          'zohoDeskOAuth2Api',
          expect.objectContaining({
            uri: expect.stringContaining('limit=50'),
          }),
        );
      });
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

      it('should return empty array on API error', async () => {
        const mockFunctions = createMockLoadOptionsFunctions();

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockRejectedValue(
          new Error('API Error'),
        );

        const result = await node.methods.loadOptions.getDepartments.call(mockFunctions);

        expect(result).toHaveLength(0);
      });

      it('should return empty array for invalid response', async () => {
        const mockFunctions = createMockLoadOptionsFunctions();

        (mockFunctions.helpers.requestOAuth2.call as jest.Mock).mockResolvedValue({
          invalid: 'response',
        });

        const result = await node.methods.loadOptions.getDepartments.call(mockFunctions);

        expect(result).toHaveLength(0);
      });
    });
  });
});
