import { Test } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../common/prisma/prisma.service';

const mockContact = {
  id: 'c-1',
  phone: '+1234567890',
  name: 'Alice',
  city: null,
  vars: null,
  tags: [],
  valid: true,
  createdAt: new Date(),
};

describe('ContactsService', () => {
  let service: ContactsService;

  const mockPrisma = {
    contact: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ContactsService);
    jest.clearAllMocks();
  });

  describe('importContacts', () => {
    it('upserts each contact and returns imported count', async () => {
      (mockPrisma.contact.upsert as jest.Mock).mockResolvedValue(mockContact);

      const result = await service.importContacts({
        contacts: [
          { phone: '+1234567890', name: 'Alice' },
          { phone: '+0987654321', name: 'Bob' },
        ],
      });

      expect(result).toEqual({ imported: 2, skipped: 0 });
      expect(mockPrisma.contact.upsert).toHaveBeenCalledTimes(2);
    });

    it('increments skipped count when upsert throws', async () => {
      (mockPrisma.contact.upsert as jest.Mock)
        .mockResolvedValueOnce(mockContact)
        .mockRejectedValueOnce(new Error('db error'));

      const result = await service.importContacts({
        contacts: [
          { phone: '+1111111111' },
          { phone: 'invalid' },
        ],
      });

      expect(result).toEqual({ imported: 1, skipped: 1 });
    });
  });

  describe('listContacts', () => {
    it('returns paginated envelope with data and total', async () => {
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([mockContact]);
      (mockPrisma.contact.count as jest.Mock).mockResolvedValue(42);

      const result = await service.listContacts();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ phone: '+1234567890' });
      expect(result.total).toBe(42);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(50);
    });

    it('caps take at 200', async () => {
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.contact.count as jest.Mock).mockResolvedValue(0);

      const result = await service.listContacts({ take: 9999 });

      expect(result.take).toBe(200);
    });
  });

  describe('validateContacts (Layer 5 E.164 validator)', () => {
    it('marks invalid phones as valid=false and valid phones as valid=true', async () => {
      const contacts = [
        { id: 'c1', phone: '+12025550191' },  // valid
        { id: 'c2', phone: '12025550191' },   // invalid — missing +
        { id: 'c3', phone: '+447911123456' }, // valid
        { id: 'c4', phone: 'not-a-phone' },   // invalid
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(contacts);
      (mockPrisma.contact.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.validateContacts();

      expect(result).toEqual({ valid: 2, invalid: 2 });

      // Invalid contacts marked false
      expect(mockPrisma.contact.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c2', 'c4'] } },
        data: { valid: false },
      });

      // Valid contacts marked true
      expect(mockPrisma.contact.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c1', 'c3'] } },
        data: { valid: true },
      });
    });

    it('returns { valid: 0, invalid: 0 } when no contacts exist', async () => {
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.validateContacts();

      expect(result).toEqual({ valid: 0, invalid: 0 });
      expect(mockPrisma.contact.updateMany).not.toHaveBeenCalled();
    });

    it('skips the invalid updateMany when all contacts are valid', async () => {
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([
        { id: 'c1', phone: '+12025550191' },
      ]);
      (mockPrisma.contact.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.validateContacts();

      expect(result).toEqual({ valid: 1, invalid: 0 });
      // Only one updateMany call (for valid)
      expect(mockPrisma.contact.updateMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.contact.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c1'] } },
        data: { valid: true },
      });
    });
  });
});
