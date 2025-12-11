/**
 * Mock utilities for n8n node unit testing
 */

import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  IPollFunctions,
  IDataObject,
  INodeExecutionData,
} from 'n8n-workflow';

/**
 * Standard mock credentials for Zoho Desk OAuth2
 */
export const mockCredentials = {
  orgId: '1234567890123456',
  baseUrl: 'https://desk.zoho.com/api/v1',
  datacenter: 'com',
  oauthTokenData: {
    access_token: 'mock_access_token_xyz',
  },
};

/**
 * Create a mock IExecuteFunctions instance for testing node execute() methods
 */
export function createMockExecuteFunctions(
  overrides: Partial<MockExecuteFunctionsConfig> = {},
): jest.Mocked<IExecuteFunctions> {
  const config: MockExecuteFunctionsConfig = {
    inputData: [{ json: {} }],
    credentials: mockCredentials,
    nodeParameters: {},
    continueOnFail: false,
    nodeName: 'Zoho Desk',
    ...overrides,
  };

  const getNodeParameter = jest
    .fn()
    .mockImplementation((name: string, itemIndex: number, defaultValue?: unknown) => {
      const value = config.nodeParameters[name];
      return value !== undefined ? value : defaultValue;
    });

  const mock = {
    getInputData: jest.fn().mockReturnValue(config.inputData),
    getNodeParameter,
    getCredentials: jest.fn().mockResolvedValue(config.credentials),
    getNode: jest.fn().mockReturnValue({ name: config.nodeName }),
    continueOnFail: jest.fn().mockReturnValue(config.continueOnFail),
    helpers: {
      returnJsonArray: jest.fn().mockImplementation((data: IDataObject | IDataObject[]) => {
        const items = Array.isArray(data) ? data : [data];
        return items.map((json) => ({ json }));
      }),
      requestOAuth2: {
        call: jest.fn().mockResolvedValue({}),
      },
    },
  } as unknown as jest.Mocked<IExecuteFunctions>;

  return mock;
}

/**
 * Configuration for mock execute functions
 */
export interface MockExecuteFunctionsConfig {
  inputData: INodeExecutionData[];
  credentials: typeof mockCredentials;
  nodeParameters: Record<string, unknown>;
  continueOnFail: boolean;
  nodeName: string;
}

/**
 * Create a mock ILoadOptionsFunctions instance for testing dropdown loading
 */
export function createMockLoadOptionsFunctions(
  overrides: Partial<MockLoadOptionsFunctionsConfig> = {},
): jest.Mocked<ILoadOptionsFunctions> {
  const config: MockLoadOptionsFunctionsConfig = {
    credentials: mockCredentials,
    currentNodeParameters: {},
    ...overrides,
  };

  const mock = {
    getCredentials: jest.fn().mockResolvedValue(config.credentials),
    getCurrentNodeParameter: jest.fn().mockImplementation((name: string) => {
      return config.currentNodeParameters[name];
    }),
    helpers: {
      requestOAuth2: {
        call: jest.fn().mockResolvedValue({}),
      },
    },
  } as unknown as jest.Mocked<ILoadOptionsFunctions>;

  return mock;
}

/**
 * Configuration for mock load options functions
 */
export interface MockLoadOptionsFunctionsConfig {
  credentials: typeof mockCredentials;
  currentNodeParameters: Record<string, unknown>;
}

/**
 * Create a mock IPollFunctions instance for testing trigger poll() methods
 */
export function createMockPollFunctions(
  overrides: Partial<MockPollFunctionsConfig> = {},
): jest.Mocked<IPollFunctions> {
  const config: MockPollFunctionsConfig = {
    credentials: mockCredentials,
    nodeParameters: {},
    workflowStaticData: {},
    ...overrides,
  };

  const mock = {
    getCredentials: jest.fn().mockResolvedValue(config.credentials),
    getNodeParameter: jest.fn().mockImplementation((name: string, defaultValue?: unknown) => {
      const value = config.nodeParameters[name];
      return value !== undefined ? value : defaultValue;
    }),
    getWorkflowStaticData: jest.fn().mockReturnValue(config.workflowStaticData),
    helpers: {
      returnJsonArray: jest.fn().mockImplementation((data: IDataObject | IDataObject[]) => {
        const items = Array.isArray(data) ? data : [data];
        return items.map((json) => ({ json }));
      }),
      requestOAuth2: {
        call: jest.fn().mockResolvedValue({}),
      },
    },
    getNode: jest.fn().mockReturnValue({ name: 'Zoho Desk Trigger' }),
  } as unknown as jest.Mocked<IPollFunctions>;

  return mock;
}

/**
 * Configuration for mock poll functions
 */
export interface MockPollFunctionsConfig {
  credentials: typeof mockCredentials;
  nodeParameters: Record<string, unknown>;
  workflowStaticData: Record<string, unknown>;
}

/**
 * Create a mock API response for list operations
 */
export function createMockListResponse<T>(data: T[], dataKey = 'data'): Record<string, T[]> {
  return { [dataKey]: data };
}

/**
 * Create a mock ticket object
 */
export function createMockTicket(overrides: Partial<MockTicket> = {}): MockTicket {
  return {
    id: '1234567890123456789',
    ticketNumber: '#1001',
    subject: 'Test Ticket',
    status: 'Open',
    priority: 'Medium',
    departmentId: '9876543210987654321',
    createdTime: '2025-12-11T10:00:00.000Z',
    modifiedTime: '2025-12-11T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Mock ticket structure
 */
export interface MockTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority?: string;
  departmentId: string;
  createdTime: string;
  modifiedTime: string;
  [key: string]: unknown;
}

/**
 * Create a mock contact object
 */
export function createMockContact(overrides: Partial<MockContact> = {}): MockContact {
  return {
    id: '1234567890123456790',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    createdTime: '2025-12-11T10:00:00.000Z',
    modifiedTime: '2025-12-11T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Mock contact structure
 */
export interface MockContact {
  id: string;
  lastName: string;
  email?: string;
  firstName?: string;
  createdTime: string;
  modifiedTime: string;
  [key: string]: unknown;
}

/**
 * Create a mock account object
 */
export function createMockAccount(overrides: Partial<MockAccount> = {}): MockAccount {
  return {
    id: '1234567890123456791',
    accountName: 'Test Company',
    createdTime: '2025-12-11T10:00:00.000Z',
    modifiedTime: '2025-12-11T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Mock account structure
 */
export interface MockAccount {
  id: string;
  accountName: string;
  createdTime: string;
  modifiedTime: string;
  [key: string]: unknown;
}

/**
 * Create a mock HTTP error
 */
export function createMockHttpError(
  message: string,
  statusCode: number,
): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

/**
 * Create a mock department
 */
export function createMockDepartment(overrides: Partial<MockDepartment> = {}): MockDepartment {
  return {
    id: '9876543210987654321',
    name: 'Support',
    ...overrides,
  };
}

/**
 * Mock department structure
 */
export interface MockDepartment {
  id: string;
  name: string;
}

/**
 * Create a mock team
 */
export function createMockTeam(overrides: Partial<MockTeam> = {}): MockTeam {
  return {
    id: '5678901234567890123',
    name: 'Team Alpha',
    ...overrides,
  };
}

/**
 * Mock team structure
 */
export interface MockTeam {
  id: string;
  name: string;
}
