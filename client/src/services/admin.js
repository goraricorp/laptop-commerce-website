import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
async function unwrap(request) {
  const { data, error } = await request;
  if (error)
    throw Object.assign(new Error(error.message), {
      code: error.code,
    });
  return data;
}
function useGetUsers(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      "admin",
      "users",
      {
        page,
        limit,
      },
    ],
    queryFn: async () => {
      const data = await unwrap(
        authClient.admin.listUsers({
          query: {
            limit,
            offset: (page - 1) * limit,
          },
        }),
      );
      return {
        items: data.users,
        page,
        limit,
        total: data.total,
      };
    },
  });
}
export { useGetUsers as getUsers };
function useGetUser(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: ["admin", "users", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      unwrap(
        authClient.admin.getUser({
          query: {
            id,
          },
        }),
      ),
  });
}
export { useGetUser as getUser };
function useUpdateUser(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      unwrap(
        authClient.admin.updateUser({
          userId: id,
          data,
        }),
      ),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "users"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateUser as updateUser };
function useDeleteUser(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      unwrap(
        authClient.admin.removeUser({
          userId: id,
        }),
      ),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "users"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteUser as deleteUser };
export const adminServices = {
  users: {
    getMany: useGetUsers,
    getOne: useGetUser,
    update: useUpdateUser,
    remove: useDeleteUser,
  },
};
