import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client/index";
import { RestaurantStaffRole } from "@/lib/interfaces";
import { User } from "@/models/customer"
import { Organization, Restaurant, RestaurantUserRole } from "@/models/organization";

export type Actor = {
  id: string;
  role: UserRole;
};

export const isAdminRole = (role: UserRole) =>
  role === UserRole.admin || role === UserRole.master;

export const getActorOrThrow = async (userId: string): Promise<Actor> => {
  const user = await User.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  console.log(user);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const requireOrganizationAdminOrSupplierLeader = async (
  userId: string,
  organizationId: string,
) => {
  const actor = await getActorOrThrow(userId);

  if (isAdminRole(actor.role)) {
    return actor;
  }

  const organization = await Organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  if (actor.role === UserRole.supplier && organization.ownerId === actor.id) {
    return actor;
  }

  throw new Error("Forbidden");
};

export const requireManagerOrAdminForRestaurant = async (
  userId: string,
  restaurantId: string,
) => {
  const actor = await getActorOrThrow(userId);

  if (isAdminRole(actor.role)) {
    return actor;
  }

  const restaurant = await Restaurant.findUnique({
    where: { id: restaurantId },
    select: { managerId: true },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  if (restaurant.managerId === userId) {
    return actor;
  }

  const managerRole = await RestaurantUserRole.findFirst({
    where: {
      restaurantId,
      userId,
      role: RestaurantStaffRole.manager,
      status: "active",
    },
    select: { id: true },
  });

  if (!managerRole) {
    throw new Error("Forbidden");
  }

  return actor;
};

export const requireManagerForRestaurant = async (
  userId: string,
  restaurantId: string,
) => {
  const actor = await getActorOrThrow(userId);

  const restaurant = await Restaurant.findUnique({
    where: { id: restaurantId },
    select: { managerId: true },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  if (restaurant.managerId === userId) {
    return actor;
  }

  const managerRole = await RestaurantUserRole.findFirst({
    where: {
      restaurantId,
      userId,
      role: RestaurantStaffRole.manager,
      status: "active",
    },
    select: { id: true },
  });

  if (!managerRole) {
    throw new Error("Forbidden");
  }

  return actor;
};

export const requireManagerAccessToStaff = async (
  userId: string,
  staffId: string,
) => {
  const actor = await getActorOrThrow(userId);

  if (isAdminRole(actor.role)) {
    return actor;
  }

  const [managedRoles, managedRestaurantsByOwner] = await Promise.all([
    RestaurantUserRole.findMany({
      where: {
        userId,
        role: RestaurantStaffRole.manager,
        status: "active",
      },
      select: { restaurantId: true },
    }),
    Restaurant.findMany({
      where: { managerId: userId },
      select: { id: true },
    }),
  ]);

  const managedRestaurantIds = [
    ...managedRoles.map((item) => item.restaurantId),
    ...managedRestaurantsByOwner.map((item) => item.id),
  ];

  if (managedRestaurantIds.length === 0) {
    throw new Error("Forbidden");
  }
  const staffAssignment = await RestaurantUserRole.findFirst({
    where: {
      userId: staffId,
      restaurantId: { in: managedRestaurantIds },
    },
    select: { id: true },
  });

  if (!staffAssignment) {
    throw new Error("Forbidden");
  }

  return actor;
};
