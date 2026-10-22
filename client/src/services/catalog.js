"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { fetchCatalogPage } from "@/lib/utils/catalog-pagination";
import { catalogSchemas, publicCatalogSchemas } from "@/schemas/catalog";
const adminKey = ["commerce", "catalog", "admin"];
const groupKey = ["commerce", "catalog"];
const endpoints = {
  categories: "/catalog/category",
  brands: "/catalog/brand",
  products: "/product",
  "product-media": "/product/media",
  "product-content-sections": "/product/content",
  "product-variants": "/product/variant",
  attributes: "/attribute",
  "attribute-values": "/attribute/item",
  "variant-attribute-values": "/attribute/variant",
};
function endpoint(resource, id) {
  const path = endpoints[resource];
  if (id === undefined) return path;
  const encodedId = String(id).split(":").map(encodeURIComponent).join("/");
  return `${path}/${encodedId}`;
}
function adminEndpoint(resource, id) {
  return `/admin/catalog/${resource}${id === undefined ? "" : "/" + String(id).split(":").map(encodeURIComponent).join("/")}`;
}
function adminReads(resource, schema) {
  return {
    getMany: function useGetMany(params = {}, options = {}) {
      return useQuery({
        ...options,
        queryKey: [...adminKey, resource, params],
        queryFn: () =>
          caller({
            url: adminEndpoint(resource),
            query: params,
            schema: listResponseSchema(schema.entity),
          }),
      });
    },
    getOne: function useGetOne(id, options = {}) {
      return useQuery({
        ...options,
        enabled: Boolean(id) && (options.enabled ?? true),
        queryKey: [...adminKey, resource, id],
        queryFn: () =>
          caller({
            url: adminEndpoint(resource, id),
            schema: schema.entity,
          }),
      });
    },
  };
}
function listResponseSchema(entity) {
  return z.object({
    items: z.array(entity),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  });
}
function useGetCategories(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "categories",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("categories"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(publicCatalogSchemas["category"].entity),
      }),
  });
}
export { useGetCategories as getCategories };
function useGetCategory(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "categories", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("categories", id),
        method: "GET",
        schema: publicCatalogSchemas["category"].entity,
      }),
  });
}
export { useGetCategory as getCategory };
function useCreateCategory(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("categories"),
        method: "POST",
        body: catalogSchemas["category"].create.parse(data),
        schema: catalogSchemas["category"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "categories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateCategory as createCategory };
function useUpdateCategory(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("categories", id),
        method: "PATCH",
        body: catalogSchemas["category"].update.parse(data),
        schema: catalogSchemas["category"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "categories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateCategory as updateCategory };
function useDeleteCategory(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("categories", id),
        method: "DELETE",
        schema: catalogSchemas["category"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "categories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteCategory as deleteCategory };
function useGetBrands(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "brands",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("brands"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(publicCatalogSchemas["brand"].entity),
      }),
  });
}
export { useGetBrands as getBrands };
function useGetBrand(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "brands", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("brands", id),
        method: "GET",
        schema: publicCatalogSchemas["brand"].entity,
      }),
  });
}
export { useGetBrand as getBrand };
function useCreateBrand(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("brands"),
        method: "POST",
        body: catalogSchemas["brand"].create.parse(data),
        schema: catalogSchemas["brand"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "brands"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateBrand as createBrand };
function useUpdateBrand(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("brands", id),
        method: "PATCH",
        body: catalogSchemas["brand"].update.parse(data),
        schema: catalogSchemas["brand"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "brands"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateBrand as updateBrand };
function useDeleteBrand(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("brands", id),
        method: "DELETE",
        schema: catalogSchemas["brand"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "brands"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteBrand as deleteBrand };
function useGetProducts(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "products",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      fetchCatalogPage(
        (page, limit) =>
          caller({
            url: endpoint("products"),
            method: "GET",
            query: {
              page,
              limit,
            },
            schema: listResponseSchema(publicCatalogSchemas["product"].entity),
          }),
        page,
        limit,
      ),
  });
}
export { useGetProducts as getProducts };
function useGetProduct(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "products", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("products", id),
        method: "GET",
        schema: publicCatalogSchemas["product"].entity,
      }),
  });
}
export { useGetProduct as getProduct };
function useCreateProduct(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("products"),
        method: "POST",
        body: catalogSchemas["product"].create.parse(data),
        schema: catalogSchemas["product"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "products"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateProduct as createProduct };
function useUpdateProduct(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("products", id),
        method: "PATCH",
        body: catalogSchemas["product"].update.parse(data),
        schema: catalogSchemas["product"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "products"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateProduct as updateProduct };
function useDeleteProduct(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("products", id),
        method: "DELETE",
        schema: catalogSchemas["product"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "products"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteProduct as deleteProduct };
function useGetProductVariants(params = {}, options = {}) {
  const productId = params.productId;
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "product-variants",
      {
        page,
        limit,
        productId,
      },
    ],
    queryFn: () =>
      fetchCatalogPage(
        (page, limit) =>
          caller({
            url: endpoint("product-variants"),
            method: "GET",
            query: {
              page,
              limit,
              productId,
            },
            schema: listResponseSchema(
              publicCatalogSchemas["product-variant"].entity,
            ),
          }),
        page,
        limit,
      ),
  });
}
export { useGetProductVariants as getProductVariants };
function useGetProductVariant(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "product-variants", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("product-variants", id),
        method: "GET",
        schema: publicCatalogSchemas["product-variant"].entity,
      }),
  });
}
export { useGetProductVariant as getProductVariant };
function useCreateProductVariant(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("product-variants"),
        method: "POST",
        body: catalogSchemas["product-variant"].create.parse(data),
        schema: catalogSchemas["product-variant"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-variants"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateProductVariant as createProductVariant };
function useUpdateProductVariant(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("product-variants", id),
        method: "PATCH",
        body: catalogSchemas["product-variant"].update.parse(data),
        schema: catalogSchemas["product-variant"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-variants"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateProductVariant as updateProductVariant };
function useDeleteProductVariant(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("product-variants", id),
        method: "DELETE",
        schema: catalogSchemas["product-variant"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-variants"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteProductVariant as deleteProductVariant };
function useGetAttributes(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "attributes",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("attributes"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(publicCatalogSchemas["attribute"].entity),
      }),
  });
}
export { useGetAttributes as getAttributes };
function useGetAttribute(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "attributes", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("attributes", id),
        method: "GET",
        schema: publicCatalogSchemas["attribute"].entity,
      }),
  });
}
export { useGetAttribute as getAttribute };
function useCreateAttribute(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("attributes"),
        method: "POST",
        body: catalogSchemas["attribute"].create.parse(data),
        schema: catalogSchemas["attribute"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "attributes"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateAttribute as createAttribute };
function useUpdateAttribute(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("attributes", id),
        method: "PATCH",
        body: catalogSchemas["attribute"].update.parse(data),
        schema: catalogSchemas["attribute"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "attributes"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateAttribute as updateAttribute };
function useDeleteAttribute(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("attributes", id),
        method: "DELETE",
        schema: catalogSchemas["attribute"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "attributes"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteAttribute as deleteAttribute };
function useGetAttributeValues(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "attribute-values",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("attribute-values"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          publicCatalogSchemas["attribute-value"].entity,
        ),
      }),
  });
}
export { useGetAttributeValues as getAttributeValues };
function useGetAttributeValue(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "attribute-values", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("attribute-values", id),
        method: "GET",
        schema: publicCatalogSchemas["attribute-value"].entity,
      }),
  });
}
export { useGetAttributeValue as getAttributeValue };
function useCreateAttributeValue(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("attribute-values"),
        method: "POST",
        body: catalogSchemas["attribute-value"].create.parse(data),
        schema: catalogSchemas["attribute-value"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "attribute-values"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateAttributeValue as createAttributeValue };
function useUpdateAttributeValue(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("attribute-values", id),
        method: "PATCH",
        body: catalogSchemas["attribute-value"].update.parse(data),
        schema: catalogSchemas["attribute-value"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "attribute-values"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateAttributeValue as updateAttributeValue };
function useDeleteAttributeValue(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("attribute-values", id),
        method: "DELETE",
        schema: catalogSchemas["attribute-value"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "attribute-values"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteAttributeValue as deleteAttributeValue };
function useGetVariantAttributeValues(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "variant-attribute-values",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("variant-attribute-values"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          publicCatalogSchemas["variant-attribute-value"].entity,
        ),
      }),
  });
}
export { useGetVariantAttributeValues as getVariantAttributeValues };
function useGetVariantAttributeValue(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "variant-attribute-values", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("variant-attribute-values", id),
        method: "GET",
        schema: publicCatalogSchemas["variant-attribute-value"].entity,
      }),
  });
}
export { useGetVariantAttributeValue as getVariantAttributeValue };
function useCreateVariantAttributeValue(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("variant-attribute-values"),
        method: "POST",
        body: catalogSchemas["variant-attribute-value"].create.parse(data),
        schema: catalogSchemas["variant-attribute-value"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "variant-attribute-values"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateVariantAttributeValue as createVariantAttributeValue };
function useUpdateVariantAttributeValue(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("variant-attribute-values", id),
        method: "PATCH",
        body: catalogSchemas["variant-attribute-value"].update.parse(data),
        schema: catalogSchemas["variant-attribute-value"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "variant-attribute-values"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateVariantAttributeValue as updateVariantAttributeValue };
function useDeleteVariantAttributeValue(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("variant-attribute-values", id),
        method: "DELETE",
        schema: catalogSchemas["variant-attribute-value"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "variant-attribute-values"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteVariantAttributeValue as deleteVariantAttributeValue };
function useGetProductMedia(params = {}, options = {}) {
  const productId = params.productId;
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "product-media",
      {
        page,
        limit,
        productId,
      },
    ],
    queryFn: () =>
      fetchCatalogPage(
        (page, limit) =>
          caller({
            url: endpoint("product-media"),
            method: "GET",
            query: {
              page,
              limit,
              productId,
            },
            schema: listResponseSchema(
              publicCatalogSchemas["product-media"].entity,
            ),
          }),
        page,
        limit,
      ),
  });
}
export { useGetProductMedia as getProductMedia };
function useGetProductMedium(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "product-media", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("product-media", id),
        method: "GET",
        schema: publicCatalogSchemas["product-media"].entity,
      }),
  });
}
export { useGetProductMedium as getProductMedium };
function useCreateProductMedium(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("product-media"),
        method: "POST",
        body: catalogSchemas["product-media"].create.parse(data),
        schema: catalogSchemas["product-media"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-media"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateProductMedium as createProductMedium };
function useUpdateProductMedium(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("product-media", id),
        method: "PATCH",
        body: catalogSchemas["product-media"].update.parse(data),
        schema: catalogSchemas["product-media"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-media"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateProductMedium as updateProductMedium };
function useDeleteProductMedium(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("product-media", id),
        method: "DELETE",
        schema: catalogSchemas["product-media"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-media"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteProductMedium as deleteProductMedium };
function useGetProductContentSections(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "product-content-sections",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("product-content-sections"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          publicCatalogSchemas["product-content-section"].entity,
        ),
      }),
  });
}
export { useGetProductContentSections as getProductContentSections };
function useGetProductContentSection(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "product-content-sections", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("product-content-sections", id),
        method: "GET",
        schema: publicCatalogSchemas["product-content-section"].entity,
      }),
  });
}
export { useGetProductContentSection as getProductContentSection };
function useCreateProductContentSection(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: adminEndpoint("product-content-sections"),
        method: "POST",
        body: catalogSchemas["product-content-section"].create.parse(data),
        schema: catalogSchemas["product-content-section"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-content-sections"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateProductContentSection as createProductContentSection };
function useUpdateProductContentSection(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: adminEndpoint("product-content-sections", id),
        method: "PATCH",
        body: catalogSchemas["product-content-section"].update.parse(data),
        schema: catalogSchemas["product-content-section"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-content-sections"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateProductContentSection as updateProductContentSection };
function useDeleteProductContentSection(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: adminEndpoint("product-content-sections", id),
        method: "DELETE",
        schema: catalogSchemas["product-content-section"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-content-sections"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteProductContentSection as deleteProductContentSection };
export const catalogServices = {
  categories: {
    getMany: useGetCategories,
    getOne: useGetCategory,
    create: useCreateCategory,
    update: useUpdateCategory,
    remove: useDeleteCategory,
  },
  brands: {
    getMany: useGetBrands,
    getOne: useGetBrand,
    create: useCreateBrand,
    update: useUpdateBrand,
    remove: useDeleteBrand,
  },
  products: {
    getMany: useGetProducts,
    getOne: useGetProduct,
    create: useCreateProduct,
    update: useUpdateProduct,
    remove: useDeleteProduct,
  },
  "product-variants": {
    getMany: useGetProductVariants,
    getOne: useGetProductVariant,
    create: useCreateProductVariant,
    update: useUpdateProductVariant,
    remove: useDeleteProductVariant,
  },
  attributes: {
    getMany: useGetAttributes,
    getOne: useGetAttribute,
    create: useCreateAttribute,
    update: useUpdateAttribute,
    remove: useDeleteAttribute,
  },
  "attribute-values": {
    getMany: useGetAttributeValues,
    getOne: useGetAttributeValue,
    create: useCreateAttributeValue,
    update: useUpdateAttributeValue,
    remove: useDeleteAttributeValue,
  },
  "variant-attribute-values": {
    getMany: useGetVariantAttributeValues,
    getOne: useGetVariantAttributeValue,
    create: useCreateVariantAttributeValue,
    update: useUpdateVariantAttributeValue,
    remove: useDeleteVariantAttributeValue,
  },
  "product-media": {
    getMany: useGetProductMedia,
    getOne: useGetProductMedium,
    create: useCreateProductMedium,
    update: useUpdateProductMedium,
    remove: useDeleteProductMedium,
  },
  "product-content-sections": {
    getMany: useGetProductContentSections,
    getOne: useGetProductContentSection,
    create: useCreateProductContentSection,
    update: useUpdateProductContentSection,
    remove: useDeleteProductContentSection,
  },
};
const catalogEntityNames = {
  categories: "category",
  brands: "brand",
  products: "product",
  "product-variants": "product-variant",
  attributes: "attribute",
  "attribute-values": "attribute-value",
  "variant-attribute-values": "variant-attribute-value",
  "product-media": "product-media",
  "product-content-sections": "product-content-section",
};
for (const [resource, schema] of Object.entries(catalogEntityNames))
  Object.assign(
    catalogServices[resource],
    adminReads(resource, catalogSchemas[schema]),
  );
export function useCatalogSearch(params = {}, options = {}) {
  const query = {
    ...params,
    ...(params.attributes
      ? {
          attributes: JSON.stringify(params.attributes),
        }
      : {}),
  };
  return useQuery({
    ...options,
    queryKey: [...groupKey, "search", query],
    queryFn: () =>
      caller({
        url: "/catalog/search",
        query,
      }),
  });
}
export function useProductDetails(id) {
  return useQuery({
    queryKey: [...groupKey, "details", id],
    enabled: Boolean(id),
    queryFn: () =>
      caller({
        url: `/product/${encodeURIComponent(id)}/details`,
      }),
  });
}
export function useCampaigns() {
  return useQuery({
    queryKey: [...groupKey, "campaigns", "active"],
    queryFn: () =>
      caller({
        url: "/catalog/campaigns",
      }),
  });
}
export function useSpotlight() {
  return useQuery({
    queryKey: [...groupKey, "spotlight"],
    queryFn: () =>
      caller({
        url: "/catalog/spotlight",
      }),
  });
}
function useCampaignWrite(method, options = {}) {
  const client = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (input) =>
      caller({
        url: adminEndpoint(
          "campaigns",
          method === "POST" ? undefined : (input.id ?? input),
        ),
        method,
        ...(method === "DELETE"
          ? {}
          : {
              body: method === "POST" ? input : input.data,
            }),
      }),
    onSuccess: async (...args) => {
      await client.invalidateQueries({
        queryKey: groupKey,
      });
      await options.onSuccess?.(...args);
    },
  });
}
catalogServices.campaigns = {
  ...adminReads("campaigns", catalogSchemas.campaign),
  create: function useCreate(options) {
    return useCampaignWrite("POST", options);
  },
  update: function useUpdate(options) {
    return useCampaignWrite("PATCH", options);
  },
  remove: function useRemove(options) {
    return useCampaignWrite("DELETE", options);
  },
};
