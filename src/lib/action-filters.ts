import { ActionSource, ActionStatus, IntakeDomain, Priority, type Prisma } from "@prisma/client";

type RegisterFilters = Record<string, string | undefined>;

export function buildActionRegisterWhere(filters: RegisterFilters): Prisma.ActionWhereInput {
  const where: Prisma.ActionWhereInput = {};

  const status = enumFilter(filters.status, ActionStatus);
  const priority = enumFilter(filters.priority, Priority);
  const source = enumFilter(filters.source, ActionSource);
  const domain = enumFilter(filters.domain, IntakeDomain);
  const dueBefore = endOfDayFilter(filters.dueBefore);
  const reviewBefore = endOfDayFilter(filters.reviewBefore);

  // The register is the company action view: exclude Personal-domain actions by
  // default (they belong to the /personal pipeline), unless a domain is explicitly
  // requested, so private household/medical tasks never surface as company work.
  where.domain = domain ?? { not: IntakeDomain.PERSONAL };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (source) where.source = source;
  if (filters.streamId) where.streamId = filters.streamId;
  if (filters.companyFunctionId) {
    where.companyFunctionId = filters.companyFunctionId;
  } else {
    const companyFunction = nameFilter(filters.companyFunction);
    if (companyFunction) {
      where.companyFunction = {
        name: {
          equals: companyFunction,
          mode: "insensitive"
        }
      };
    }
  }
  if (dueBefore) where.dueAt = { lte: dueBefore };
  if (reviewBefore) where.reviewAt = { lte: reviewBefore };

  return where;
}

function enumFilter<T extends Record<string, string>>(value: string | undefined, values: T): T[keyof T] | undefined {
  if (!value || value === "ALL") return undefined;
  return Object.values(values).includes(value) ? (value as T[keyof T]) : undefined;
}

function endOfDayFilter(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function nameFilter(value: string | undefined) {
  const normalized = value?.replaceAll("+", " ").trim();
  return normalized ? normalized : undefined;
}
