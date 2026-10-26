import { Types, type FilterQuery } from 'mongoose';
import { Customer, type ICustomer } from '@/models/Customer.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryParams,
} from '@/validators/customer.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class CustomerService {
  /**
   * Create a new customer
   */
  static async create(
    data: CreateCustomerInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICustomer> {
    const existingPhone = await Customer.findOne({
      phone: data.phone,
      isDeleted: false,
    });
    if (existingPhone) {
      throw AppError.conflict(`An active customer with phone "${data.phone}" already exists.`);
    }

    if (data.email) {
      const existingEmail = await Customer.findOne({
        email: data.email.toLowerCase(),
        isDeleted: false,
      });
      if (existingEmail) {
        throw AppError.conflict(`An active customer with email "${data.email}" already exists.`);
      }
    }

    const customer = await Customer.create({
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone, email: customer.email },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return customer;
  }

  /**
   * List customers with pagination, search, status and idType filters
   */
  static async list(query: CustomerQueryParams): Promise<IPaginatedResult<ICustomer>> {
    const allowedSort = ['createdAt', 'name', 'phone', 'email', 'status'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<ICustomer> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.idType) {
      filter.idType = query.idType;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { idNumber: { $regex: options.search, $options: 'i' } },
      ];
    }

    return paginateQuery<ICustomer>(Customer, filter, options);
  }

  /**
   * Find a customer by ID
   */
  static async getById(id: string): Promise<ICustomer> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid customer identifier format');
    }

    const customer = await Customer.findOne({ _id: id, isDeleted: false });
    if (!customer) {
      throw AppError.notFound('Customer');
    }

    return customer;
  }

  /**
   * Update an existing customer
   */
  static async update(
    id: string,
    data: UpdateCustomerInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICustomer> {
    const customer = await this.getById(id);

    if (data.phone && data.phone !== customer.phone) {
      const conflict = await Customer.findOne({
        _id: { $ne: customer._id },
        phone: data.phone,
        isDeleted: false,
      });
      if (conflict) {
        throw AppError.conflict(`An active customer with phone "${data.phone}" already exists.`);
      }
    }

    if (data.email && data.email.toLowerCase() !== customer.email) {
      const conflict = await Customer.findOne({
        _id: { $ne: customer._id },
        email: data.email.toLowerCase(),
        isDeleted: false,
      });
      if (conflict) {
        throw AppError.conflict(`An active customer with email "${data.email}" already exists.`);
      }
    }

    Object.assign(customer, {
      ...data,
      email: data.email ? data.email.toLowerCase() : customer.email,
    });
    await customer.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      details: { updatedFields: Object.keys(data) },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return customer;
  }

  /**
   * Soft-delete a customer
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICustomer> {
    return softDeleteDocument(Customer, id, user?.id, reqContext);
  }

  /**
   * Restore a soft-deleted customer
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICustomer> {
    return restoreDocument(Customer, id, user?.id, {
      uniqueChecks: [{ field: 'phone' }],
      reqContext,
    });
  }
}
